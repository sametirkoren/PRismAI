import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    const { type, index } = await req.json();

    if (!type || index === undefined) {
      return NextResponse.json(
        { error: "Type and index are required" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Parse the current data
    let data: unknown = review[type as keyof typeof review];
    if (typeof data === "string") {
      data = JSON.parse(data);
    }

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Remove the item at the specified index
    data.splice(index, 1);

    // Update the review
    await prisma.review.update({
      where: { id },
      data: { [type]: data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    );
  }
}
