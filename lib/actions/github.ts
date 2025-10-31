"use server";

import { auth } from "@/auth";
import { Octokit } from "@octokit/rest";
import { prisma } from "@/lib/prisma";
import type { components } from "@octokit/openapi-types";

// Extend the PR type to include fields that are sometimes present
type PullRequest = components["schemas"]["pull-request-simple"] & {
  changed_files?: number;
  additions?: number;
  deletions?: number;
};

async function getOctokit() {
  const session = await auth();
  if (!session?.user?.id) {
    console.error("No session or user ID found");
    throw new Error("Unauthorized");
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "github",
    },
  });

  if (!account) {
    console.error(`No GitHub account found for user ${session.user.id}`);
    console.error("User info:", JSON.stringify(session.user, null, 2));
    throw new Error("GitHub account not connected");
  }

  if (!account.access_token) {
    console.error(`GitHub account found but no access token for user ${session.user.id}`);
    throw new Error("GitHub account not connected");
  }

  const octokit = new Octokit({
    auth: account.access_token,
  });

  try {
    // Get the actual GitHub username from the API
    const { data: user } = await octokit.users.getAuthenticated();

    return {
      octokit,
      githubLogin: user.login, // This is the actual username, not the ID
    };
  } catch (error) {
    // If we get a 401, the token is invalid or expired
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      console.error("GitHub token is invalid or expired. User needs to re-authenticate.");
      throw new Error("GITHUB_TOKEN_EXPIRED");
    }
    throw error;
  }
}

export async function getUserRepos() {
  try {
    const { octokit } = await getOctokit();
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
      affiliation: "owner,collaborator",
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      description: repo.description,
      updatedAt: repo.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching repos:", error);
    return [];
  }
}

export async function getAllPRs(owner?: string, repo?: string, state: 'open' | 'closed' | 'all' = 'open') {
  try {
    const { octokit, githubLogin } = await getOctokit();
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    console.log("[getAllPRs] GitHub login ID:", githubLogin);
    
    if (owner && repo) {
      // Get PRs for specific repo (filter by user)
      const { data } = await octokit.pulls.list({
        owner,
        repo,
        state,
        per_page: 100,
      });

      // Filter only user's PRs
      const userPRs = data.filter((pr) => pr.user?.login === githubLogin);

      // Get review counts for these PRs
      const reviewCounts = await prisma.review.groupBy({
        by: ['owner', 'repo', 'prNumber'],
        where: {
          userId: session.user.id,
          owner,
          repo,
          prNumber: { in: userPRs.map(pr => pr.number) },
        },
        _count: true,
      });

      const countMap = reviewCounts.reduce((acc, item) => {
        acc[`${item.owner}/${item.repo}/${item.prNumber}`] = item._count;
        return acc;
      }, {} as Record<string, number>);

      // Fetch detailed stats for each PR
      const prsWithDetails = await Promise.all(
        userPRs.map(async (pr) => {
          try {
            const { data: detailedPR } = await octokit.pulls.get({
              owner,
              repo,
              pull_number: pr.number,
            });
            console.log(`[getAllPRs] PR #${pr.number} stats:`, {
              changed_files: detailedPR.changed_files,
              additions: detailedPR.additions,
              deletions: detailedPR.deletions,
            });
            return {
              id: detailedPR.id,
              number: detailedPR.number,
              title: detailedPR.title,
              owner,
              repo,
              author: detailedPR.user?.login || "",
              authorAvatar: detailedPR.user?.avatar_url || "",
              createdAt: detailedPR.created_at,
              updatedAt: detailedPR.updated_at,
              filesChanged: detailedPR.changed_files || 0,
              additions: detailedPR.additions || 0,
              deletions: detailedPR.deletions || 0,
              state: detailedPR.state,
              reviewCount: countMap[`${owner}/${repo}/${detailedPR.number}`] || 0,
              hasAIReviewLabel: detailedPR.labels?.some(label => label.name === "AI Reviewed") || false,
            };
          } catch (error) {
            console.error(`Error fetching details for PR #${pr.number}:`, error);
            // Fallback to basic info if detailed fetch fails
            return {
              id: pr.id,
              number: pr.number,
              title: pr.title,
              owner,
              repo,
              author: pr.user?.login || "",
              authorAvatar: pr.user?.avatar_url || "",
              createdAt: pr.created_at,
              updatedAt: pr.updated_at,
              filesChanged: 0,
              additions: 0,
              deletions: 0,
              state: pr.state,
              reviewCount: countMap[`${owner}/${repo}/${pr.number}`] || 0,
              hasAIReviewLabel: pr.labels?.some(label => label.name === "AI Reviewed") || false,
            };
          }
        })
      );

      return prsWithDetails;
    }

    // Get all PRs from user's repos
    const repos = await getUserRepos();
    console.log(`[getAllPRs] Found ${repos.length} repos`);
    const allPRs: Array<{
      id: number;
      number: number;
      title: string;
      owner: string;
      repo: string;
      author: string;
      authorAvatar: string;
      createdAt: string;
      updatedAt: string;
      filesChanged: number;
      additions: number;
      deletions: number;
      state: string;
      reviewCount: number;
      hasAIReviewLabel: boolean;
    }> = [];

    for (const userRepo of repos.slice(0, 10)) { // Limit to 10 repos for performance
      try {
        const { data } = await octokit.pulls.list({
          owner: userRepo.owner,
          repo: userRepo.name,
          state,
          per_page: 50,
        });

        console.log(`[getAllPRs] Repo ${userRepo.fullName}: ${data.length} ${state} PRs`);
        if (data.length > 0) {
          console.log(`[getAllPRs] PR authors:`, data.map(pr => pr.user?.login));
        }
        
        // Filter only user's PRs
        const userPRs = data.filter((pr) => pr.user?.login === githubLogin);

        // Fetch detailed stats for each PR
        const prsWithDetails = await Promise.all(
          userPRs.map(async (pr) => {
            try {
              const { data: detailedPR } = await octokit.pulls.get({
                owner: userRepo.owner,
                repo: userRepo.name,
                pull_number: pr.number,
              });
              console.log(`[getAllPRs] ${userRepo.fullName} PR #${pr.number} stats:`, {
                changed_files: detailedPR.changed_files,
                additions: detailedPR.additions,
                deletions: detailedPR.deletions,
              });
              return {
                id: detailedPR.id,
                number: detailedPR.number,
                title: detailedPR.title,
                owner: userRepo.owner,
                repo: userRepo.name,
                author: detailedPR.user?.login || "",
                authorAvatar: detailedPR.user?.avatar_url || "",
                createdAt: detailedPR.created_at,
                updatedAt: detailedPR.updated_at,
                filesChanged: detailedPR.changed_files || 0,
                additions: detailedPR.additions || 0,
                deletions: detailedPR.deletions || 0,
                state: detailedPR.state,
                reviewCount: 0,
                hasAIReviewLabel: detailedPR.labels?.some(label => label.name === "AI Reviewed") || false,
              };
            } catch (error) {
              console.error(`[getAllPRs] Error fetching details for PR #${pr.number}:`, error);
              // Fallback to basic info
              const prWithDetails = pr as PullRequest;
              return {
                id: prWithDetails.id,
                number: prWithDetails.number,
                title: prWithDetails.title,
                owner: userRepo.owner,
                repo: userRepo.name,
                author: prWithDetails.user?.login || "",
                authorAvatar: prWithDetails.user?.avatar_url || "",
                createdAt: prWithDetails.created_at,
                updatedAt: prWithDetails.updated_at,
                filesChanged: prWithDetails.changed_files || 0,
                additions: prWithDetails.additions || 0,
                deletions: prWithDetails.deletions || 0,
                state: prWithDetails.state,
                reviewCount: 0,
                hasAIReviewLabel: prWithDetails.labels?.some(label => label.name === "AI Reviewed") || false,
              };
            }
          })
        );

        allPRs.push(...prsWithDetails);
      } catch (error) {
        console.error(`Error fetching PRs for ${userRepo.fullName}:`, error);
      }
    }

    // Get review counts for all PRs
    if (allPRs.length > 0) {
      const reviewCounts = await prisma.review.groupBy({
        by: ['owner', 'repo', 'prNumber'],
        where: {
          userId: session.user.id,
          OR: allPRs.map(pr => ({
            owner: pr.owner,
            repo: pr.repo,
            prNumber: pr.number,
          })),
        },
        _count: true,
      });

      const countMap = reviewCounts.reduce((acc, item) => {
        acc[`${item.owner}/${item.repo}/${item.prNumber}`] = item._count;
        return acc;
      }, {} as Record<string, number>);

      // Add review counts to PRs
      allPRs.forEach(pr => {
        pr.reviewCount = countMap[`${pr.owner}/${pr.repo}/${pr.number}`] || 0;
      });
    }

    return allPRs;
  } catch (error) {
    console.error("Error fetching PRs:", error);
    return [];
  }
}

export async function getOpenPRs(owner?: string, repo?: string) {
  try {
    const { octokit, githubLogin } = await getOctokit();
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    console.log("[getOpenPRs] GitHub login ID:", githubLogin);
    
    if (owner && repo) {
      // Get PRs for specific repo (filter by user)
      const { data } = await octokit.pulls.list({
        owner,
        repo,
        state: "open",
        per_page: 100,
      });

      // Filter only user's PRs
      const userPRs = data.filter((pr) => pr.user?.login === githubLogin);

      // Get review counts for these PRs
      const reviewCounts = await prisma.review.groupBy({
        by: ['owner', 'repo', 'prNumber'],
        where: {
          userId: session.user.id,
          owner,
          repo,
          prNumber: { in: userPRs.map(pr => pr.number) },
        },
        _count: true,
      });

      const countMap = reviewCounts.reduce((acc, item) => {
        acc[`${item.owner}/${item.repo}/${item.prNumber}`] = item._count;
        return acc;
      }, {} as Record<string, number>);

      return userPRs.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        owner,
        repo,
        author: pr.user?.login || "",
        authorAvatar: pr.user?.avatar_url || "",
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        filesChanged: 0,
        additions: 0,
        deletions: 0,
        state: pr.state,
        reviewCount: countMap[`${owner}/${repo}/${pr.number}`] || 0,
        hasAIReviewLabel: pr.labels?.some(label => label.name === "AI Reviewed") || false,
      }));
    }

    // Get all open PRs from user's repos (only user's PRs)
    const repos = await getUserRepos();
    console.log(`[getOpenPRs] Found ${repos.length} repos`);
    const allPRs: Array<{
      id: number;
      number: number;
      title: string;
      owner: string;
      repo: string;
      author: string;
      authorAvatar: string;
      createdAt: string;
      updatedAt: string;
      filesChanged: number;
      additions: number;
      deletions: number;
      state: string;
      reviewCount: number;
    }> = [];

    for (const userRepo of repos.slice(0, 10)) { // Limit to 10 repos for performance
      try {
        const { data } = await octokit.pulls.list({
          owner: userRepo.owner,
          repo: userRepo.name,
          state: "open",
          per_page: 50,
        });

        console.log(`[getOpenPRs] Repo ${userRepo.fullName}: ${data.length} open PRs`);
        if (data.length > 0) {
          console.log(`[getOpenPRs] PR authors:`, data.map(pr => pr.user?.login));
        }
        
        // Filter only user's PRs
        const userPRs = data.filter((pr) => pr.user?.login === githubLogin);

        const prs = userPRs.map((pr) => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          owner: userRepo.owner,
          repo: userRepo.name,
          author: pr.user?.login || "",
          authorAvatar: pr.user?.avatar_url || "",
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          filesChanged: 0,
          additions: 0,
          deletions: 0,
          state: pr.state,
          reviewCount: 0,
          hasAIReviewLabel: pr.labels?.some(label => label.name === "AI Reviewed") || false,
        }));

        allPRs.push(...prs);
      } catch (error) {
        console.error(`Error fetching PRs for ${userRepo.fullName}:`, error);
      }
    }

    // Get review counts for all PRs
    if (allPRs.length > 0) {
      const reviewCounts = await prisma.review.groupBy({
        by: ['owner', 'repo', 'prNumber'],
        where: {
          userId: session.user.id,
          OR: allPRs.map(pr => ({
            owner: pr.owner,
            repo: pr.repo,
            prNumber: pr.number,
          })),
        },
        _count: true,
      });

      const countMap = reviewCounts.reduce((acc, item) => {
        acc[`${item.owner}/${item.repo}/${item.prNumber}`] = item._count;
        return acc;
      }, {} as Record<string, number>);

      // Add review counts to PRs
      allPRs.forEach(pr => {
        pr.reviewCount = countMap[`${pr.owner}/${pr.repo}/${pr.number}`] || 0;
      });
    }

    return allPRs;
  } catch (error) {
    console.error("Error fetching PRs:", error);
    return [];
  }
}

export async function getPRDetails(owner: string, repo: string, prNumber: number) {
  try {
    const { octokit } = await getOctokit();
    
    const [{ data: pr }, { data: files }] = await Promise.all([
      octokit.pulls.get({ owner, repo, pull_number: prNumber }),
      octokit.pulls.listFiles({ owner, repo, pull_number: prNumber }),
    ]);

    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      author: pr.user?.login || "",
      authorAvatar: pr.user?.avatar_url || "",
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      filesChanged: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      state: pr.state,
      headSha: pr.head?.sha,
      headRef: pr.head?.ref || "",
      baseRef: pr.base?.ref || "",
      files: files.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        contents_url: file.contents_url,
      })),
    };
  } catch (error) {
    console.error("Error fetching PR details:", error);
    throw error;
  }
}

export async function addLabelToPR(owner: string, repo: string, prNumber: number) {
  try {
    const { octokit } = await getOctokit();
    
    // Check if label exists, create if not
    try {
      await octokit.issues.getLabel({
        owner,
        repo,
        name: "AI Reviewed",
      });
    } catch {
      // Label doesn't exist, create it
      await octokit.issues.createLabel({
        owner,
        repo,
        name: "AI Reviewed",
        color: "8B5CF6",
        description: "This PR has been reviewed by AI",
      });
    }

    // Add label to PR
    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number: prNumber,
      labels: ["AI Reviewed"],
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding label:", error);
    throw error;
  }
}

export async function addCommentToPR(
  owner: string,
  repo: string,
  prNumber: number,
  comment: string
) {
  try {
    const { octokit } = await getOctokit();
    
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment,
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}
