import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPRDetails } from "@/lib/actions/github";
import { reviewCodeWithClaude } from "@/lib/ai/claude";

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, prNumber, reviewType } = await request.json();

    if (!owner || !repo || !prNumber || !reviewType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get PR details
    const prDetails = await getPRDetails(owner, repo, prNumber);

    // Create review record
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        owner,
        repo,
        prNumber,
        prTitle: prDetails.title,
        reviewType,
        status: "PROCESSING",
        filesChanged: prDetails.filesChanged,
        linesAdded: prDetails.additions,
        linesRemoved: prDetails.deletions,
      },
    });

    // Start AI review in background (don't await)
    reviewCodeWithClaude(review.id, prDetails, reviewType).catch((error) => {
      console.error("Error in AI review:", error);
      prisma.review.update({
        where: { id: review.id },
        data: { status: "FAILED" },
      });
    });

    return NextResponse.json({ reviewId: review.id });
  } catch (error) {
    console.error("Error starting review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
