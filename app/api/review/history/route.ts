import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const prNumber = searchParams.get("prNumber");

    if (!owner || !repo || !prNumber) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        userId: session.user.id,
        owner,
        repo,
        prNumber: parseInt(prNumber),
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        reviewType: true,
        createdAt: true,
        completedAt: true,
        commentAdded: true,
        labelAdded: true,
        critical: true,
        suggestions: true,
        bestPractices: true,
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching review history:", error);
    return NextResponse.json(
      { error: "Failed to fetch review history" },
      { status: 500 }
    );
  }
}
