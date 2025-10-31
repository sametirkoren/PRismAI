import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Default prompts
const DEFAULT_PROMPTS = {
  backend: `You are an expert backend code reviewer. Analyze the code changes and provide:
1. Critical Issues: Security vulnerabilities, performance problems, logic errors
2. Suggestions: Code improvements, better patterns, optimization opportunities
3. Best Practices: Industry standards, design patterns, maintainability improvements

Focus on: API design, database queries, error handling, security, performance, scalability.`,
  
  frontend: `You are an expert frontend code reviewer. Analyze the code changes and provide:
1. Critical Issues: Security issues, accessibility problems, performance bottlenecks
2. Suggestions: Component structure, state management, code organization
3. Best Practices: UI/UX patterns, responsive design, modern practices

Focus on: Component design, accessibility, performance, user experience, code organization.`,
  
  mobile: `You are an expert mobile code reviewer. Analyze the code changes and provide:
1. Critical Issues: Memory leaks, performance issues, crash risks
2. Suggestions: Architecture improvements, state management, code reusability
3. Best Practices: Mobile-specific patterns, platform guidelines, optimization

Focus on: Performance, memory management, platform guidelines, user experience, battery efficiency.`
};

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          language: "en",
          backendPrompt: DEFAULT_PROMPTS.backend,
          frontendPrompt: DEFAULT_PROMPTS.frontend,
          mobilePrompt: DEFAULT_PROMPTS.mobile,
        },
      });
    }

    // Don't send API key to client
    const { claudeApiKey, ...settingsWithoutKey } = settings;
    const hasApiKey = !!claudeApiKey;

    return NextResponse.json({
      ...settingsWithoutKey,
      hasApiKey,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { language, claudeApiKey, backendPrompt, frontendPrompt, mobilePrompt } = body;

    // Prepare update data
    const updateData: Record<string, string | null> = {};
    if (language) updateData.language = language;
    if (backendPrompt !== undefined) updateData.backendPrompt = backendPrompt;
    if (frontendPrompt !== undefined) updateData.frontendPrompt = frontendPrompt;
    if (mobilePrompt !== undefined) updateData.mobilePrompt = mobilePrompt;
    
    // Only update API key if provided
    if (claudeApiKey !== undefined) {
      // In production, encrypt this before storing
      updateData.claudeApiKey = claudeApiKey || null;
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        language: language || "en",
        claudeApiKey: claudeApiKey || null,
        backendPrompt: backendPrompt || DEFAULT_PROMPTS.backend,
        frontendPrompt: frontendPrompt || DEFAULT_PROMPTS.frontend,
        mobilePrompt: mobilePrompt || DEFAULT_PROMPTS.mobile,
      },
    });

    // Don't send API key to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { claudeApiKey: _, ...settingsWithoutKey } = settings;
    const hasApiKey = !!settings.claudeApiKey;

    return NextResponse.json({
      ...settingsWithoutKey,
      hasApiKey,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
