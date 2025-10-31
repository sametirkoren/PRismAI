import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addCommentToPR, addLabelToPR } from "@/lib/actions/github";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Parse the review data
    const critical = Array.isArray(review.critical)
      ? review.critical
      : typeof review.critical === "string"
      ? JSON.parse(review.critical)
      : [];
    const suggestions = Array.isArray(review.suggestions)
      ? review.suggestions
      : typeof review.suggestions === "string"
      ? JSON.parse(review.suggestions)
      : [];
    const bestPractices = Array.isArray(review.bestPractices)
      ? review.bestPractices
      : typeof review.bestPractices === "string"
      ? JSON.parse(review.bestPractices)
      : [];


    // Build the comment
    let comment = `## 🤖 AI Code Review\n\n`;
    comment += `This PR has been automatically reviewed by Claude AI.\n\n`;

    interface Issue {
      file: string;
      line: number;
      issue: string;
      suggestion: string;
    }

    if (critical.length > 0) {
      comment += `### 🔴 Critical Issues (${critical.length})\n\n`;
      (critical as Issue[]).forEach((issue, idx) => {
        comment += `#### ${idx + 1}. \`${issue.file}:${issue.line}\`\n`;
        comment += `**Issue:** ${issue.issue}\n\n`;
        comment += `**Suggestion:**\n\`\`\`\n${issue.suggestion}\n\`\`\`\n\n`;
      });
    }

    if (suggestions.length > 0) {
      comment += `### 💡 Suggestions (${suggestions.length})\n\n`;
      (suggestions as Issue[]).forEach((issue, idx) => {
        comment += `#### ${idx + 1}. \`${issue.file}:${issue.line}\`\n`;
        comment += `**Issue:** ${issue.issue}\n\n`;
        comment += `**Suggestion:**\n\`\`\`\n${issue.suggestion}\n\`\`\`\n\n`;
      });
    }

    if (bestPractices.length > 0) {
      comment += `### ✅ Best Practices (${bestPractices.length})\n\n`;
      (bestPractices as Issue[]).forEach((issue, idx) => {
        comment += `#### ${idx + 1}. \`${issue.file}:${issue.line}\`\n`;
        comment += `**Issue:** ${issue.issue}\n\n`;
        comment += `**Suggestion:**\n\`\`\`\n${issue.suggestion}\n\`\`\`\n\n`;
      });
    }

    comment += `\n---\n*Reviewed by AI Code Review*`;

    // Post summary comment to GitHub
    await addCommentToPR(review.owner, review.repo, review.prNumber, comment);

    // Create inline review comments with file/line context when possible
    try {
      const { Octokit } = await import("@octokit/rest");
      const { prisma } = await import("@/lib/prisma");
      const { auth } = await import("@/auth");

      const session = await auth();
      const account = await prisma.account.findFirst({
        where: { userId: session!.user!.id, provider: "github" },
      });

      if (account?.access_token) {
        const octokit = new Octokit({ auth: account.access_token });

        // Get PR details including files
        const { data: pr } = await octokit.pulls.get({
          owner: review.owner,
          repo: review.repo,
          pull_number: review.prNumber,
        });
        const sha = pr.head.sha;

        // Get PR files to map line numbers to positions in diff
        const { data: files } = await octokit.pulls.listFiles({
          owner: review.owner,
          repo: review.repo,
          pull_number: review.prNumber,
        });

        // Create a map of file -> line -> position
        const fileLineToPosition = new Map<string, Map<number, number>>();
        files.forEach((file) => {
          if (!file.patch) return;
          const lineMap = new Map<number, number>();
          const lines = file.patch.split('\n');
          let position = 0;
          let rightLineNum = 0;

          lines.forEach((line) => {
            position++;
            // Track right side line numbers (added or context lines)
            if (line.startsWith('@@')) {
              const match = line.match(/\+([0-9]+)/);
              if (match) {
                rightLineNum = parseInt(match[1]) - 1;
              }
            } else if (!line.startsWith('-')) {
              rightLineNum++;
              lineMap.set(rightLineNum, position);
            }
          });
          fileLineToPosition.set(file.filename, lineMap);
        });

        type Issue = { file: string; line: number; issue: string; suggestion: string };
        const toComments = (arr: Issue[]) =>
          arr.slice(0, 30).map((it) => {
            const lineMap = fileLineToPosition.get(it.file);
            const position = lineMap?.get(it.line);
            
            if (!position) {
              console.log(`[Review] Skipping comment for ${it.file}:${it.line} - line not in diff`);
              return null;
            }

            return {
              path: it.file,
              position,
              body: `**AI Review**\n\n**Issue:** ${it.issue}\n\n**Suggestion:**\n\`\`\`suggestion\n${it.suggestion}\n\`\`\``,
            };
          }).filter((c): c is NonNullable<typeof c> => c !== null);

        const comments = [
          ...toComments(Array.isArray(critical) ? critical : []),
          ...toComments(Array.isArray(suggestions) ? suggestions : []),
          ...toComments(Array.isArray(bestPractices) ? bestPractices : []),
        ].slice(0, 50);

        console.log(`[Review] Creating review with ${comments.length} inline comments`);

        if (comments.length > 0) {
          await octokit.pulls.createReview({
            owner: review.owner,
            repo: review.repo,
            pull_number: review.prNumber,
            commit_id: sha,
            event: "COMMENT",
            body: `## 📝 Inline Review Comments\n\nI've added ${comments.length} inline comments to the code. Please review them below.`,
            comments,
          });
        }
      }
    } catch (e) {
      console.error("Failed to create inline review comments:", e);
      // continue without failing the request
    }

    // Add label
    await addLabelToPR(review.owner, review.repo, review.prNumber);

    // Update review status
    await prisma.review.update({
      where: { id },
      data: {
        commentAdded: true,
        labelAdded: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
