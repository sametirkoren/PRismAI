import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No session found" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all sessions for this user first
    await prisma.session.deleteMany({
      where: {
        userId,
      },
    });

    // Delete all accounts for this user
    await prisma.account.deleteMany({
      where: {
        userId,
      },
    });

    // Delete all reviews for this user
    await prisma.review.deleteMany({
      where: {
        userId,
      },
    });

    // Finally, delete the user
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing GitHub account:", error);
    return NextResponse.json({ success: false, error: "Failed to clear account" }, { status: 500 });
  }
}
