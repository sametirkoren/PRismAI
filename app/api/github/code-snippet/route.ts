import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Octokit } from "@octokit/rest";

async function getOctokit() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "github",
    },
  });

  if (!account?.access_token) {
    throw new Error("GitHub account not connected");
  }

  return new Octokit({
    auth: account.access_token,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, path, lineRange, ref } = await req.json();

    if (!owner || !repo || !path || !lineRange) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const octokit = await getOctokit();

    // Get the file content
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: ref || undefined,
    });

    if (!("content" in data) || Array.isArray(data)) {
      return NextResponse.json(
        { error: "File not found or is a directory" },
        { status: 404 }
      );
    }

    // Decode the base64 content
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const lines = content.split("\n");

    // Parse lineRange (e.g., "146-149" or "95")
    const rangeParts = lineRange.split('-');
    const rangeStart = parseInt(rangeParts[0]);
    const rangeEnd = rangeParts.length > 1 ? parseInt(rangeParts[1]) : rangeStart;

    // Get context: 3 lines before and after the range
    const startLine = Math.max(0, rangeStart - 4);
    const endLine = Math.min(lines.length - 1, rangeEnd + 2);

    const snippet = {
      code: lines.slice(startLine, endLine + 1).join("\n"),
      startLine: startLine + 1,
      endLine: endLine + 1,
      rangeStart,
      rangeEnd,
    };

    return NextResponse.json(snippet);
  } catch (error) {
    console.error("Error fetching code snippet:", error);
    return NextResponse.json(
      { error: "Failed to fetch code snippet" },
      { status: 500 }
    );
  }
}
