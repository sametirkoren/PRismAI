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

    const { owner, repo, path, line, ref } = await req.json();

    if (!owner || !repo || !path || !line) {
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

    // Get 3 lines before and after the target line
    const targetLine = parseInt(line.toString());
    const startLine = Math.max(0, targetLine - 4);
    const endLine = Math.min(lines.length - 1, targetLine + 2);

    const snippet = {
      code: lines.slice(startLine, endLine + 1).join("\n"),
      startLine: startLine + 1,
      endLine: endLine + 1,
      targetLine,
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
