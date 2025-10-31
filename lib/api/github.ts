import { Octokit } from "@octokit/rest"

export function createGitHubClient(accessToken: string) {
  return new Octokit({ auth: accessToken })
}

export async function getUserRepos(accessToken: string) {
  const octokit = createGitHubClient(accessToken)
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  })
  return data
}

export async function getRepoPRs(
  accessToken: string,
  owner: string,
  repo: string
) {
  const octokit = createGitHubClient(accessToken)
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 100,
  })
  return data
}

export async function getPRDetails(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = createGitHubClient(accessToken)
  
  const [pr, files] = await Promise.all([
    octokit.pulls.get({ owner, repo, pull_number: prNumber }),
    octokit.pulls.listFiles({ owner, repo, pull_number: prNumber }),
  ])

  return {
    pr: pr.data,
    files: files.data,
  }
}

export async function addLabelToPR(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
  label: string
) {
  const octokit = createGitHubClient(accessToken)
  
  // Create label if it doesn't exist
  try {
    await octokit.issues.createLabel({
      owner,
      repo,
      name: label,
      color: "8B5CF6",
      description: "This PR has been reviewed by AI",
    })
  } catch (error) {
    if ((error as { status?: number }).status !== 422) throw error // 422 means label already exists
  }

  // Add label to PR
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: [label],
  })
}

export async function addCommentToPR(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
  comment: string
) {
  const octokit = createGitHubClient(accessToken)
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: comment,
  })
}
