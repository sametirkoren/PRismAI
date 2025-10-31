import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPTS = {
  BACKEND: `Sen profesyonel bir backend kod inceleyicisisin.

Odak Alanların:
- API güvenliği (SQL injection, XSS, CSRF, auth)
- Veritabanı optimizasyonu (N+1, indexing)
- Hata yönetimi ve loglama
- Mimari desenler ve performans

DIFF FORMATINI ANLA:
- Satır başında "-" = Silinen kod (ESKİ)
- Satır başında "+" = Eklenen kod (YENİ)  
- Prefix yok = Değişmeyen satır (context)

ÖNEMLİ: "+" ile başlayan satırlar ZATEN EKLENMIŞ. Bunları tekrar önerme!

Kategoriler:
1. critical: Güvenlik ve bug'lar
2. suggestions: İyileştirmeler
3. bestPractices: Kod kalitesi

Her bulgu için spesifik dosya adı ve satır numarası ver.`,

  FRONTEND: `Sen profesyonel bir frontend kod inceleyicisisin.

Odak Alanların:
- React/Next.js best practices ve hooks
- Performans (bundle, lazy loading, memoization)
- Erişilebilirlik (WCAG, a11y)
- State management ve side effects
- UI/UX patterns

DIFF FORMATINI ANLA:
- "-" = Silinen kod (ESKİ)
- "+" = Eklenen kod (YENİ, ZATEN EKLENMIŞ)
- Prefix yok = Context

ÖNEMLİ: "+" satırları tekrar önerme, bunlar zaten PR'da!

Kategoriler: critical, suggestions, bestPractices`,

  MOBILE: `Sen profesyonel bir mobil kod inceleyicisisin.

Odak Alanların:
- Platform guidelines (iOS HIG, Material Design)
- Battery ve memory optimization
- Offline support ve error handling
- Native API kullanımı

DIFF FORMATINI ANLA:
- "-" = Silinen 
- "+" = Eklenen (YENİ KOD)
- Prefix yok = Context

ÖNEMLİ: "+" satırları tekrar önerme!

Kategoriler: critical, suggestions, bestPractices`,
};

interface PRDetails {
  title: string;
  body: string | null;
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}

interface ReviewResult {
  critical: Array<{
    file: string;
    line: number;
    issue: string;
    suggestion: string;
    severity: "high" | "medium" | "low";
    labels: string[];
  }>;
  suggestions: Array<{
    file: string;
    line: number;
    issue: string;
    suggestion: string;
    labels: string[];
  }>;
  bestPractices: Array<{
    file: string;
    line: number;
    issue: string;
    suggestion: string;
    labels: string[];
  }>;
}

export async function reviewCodeWithClaude(
  reviewId: string,
  prDetails: PRDetails,
  reviewType: "BACKEND" | "FRONTEND" | "MOBILE"
): Promise<void> {
  try {
    // Get review and user settings
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          include: {
            userSettings: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error("Review not found");
    }

    const apiKey = review.user.userSettings?.claudeApiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error("Claude API key bulunamadı. Lütfen Settings'den API key ekleyin.");
    }

    const anthropic = new Anthropic({ apiKey });

    // Get custom prompt from user settings or use default
    let systemPrompt = SYSTEM_PROMPTS[reviewType];
    if (review.user.userSettings) {
      const customPrompt = reviewType === "BACKEND" 
        ? review.user.userSettings.backendPrompt
        : reviewType === "FRONTEND"
        ? review.user.userSettings.frontendPrompt
        : review.user.userSettings.mobilePrompt;
      
      if (customPrompt) {
        systemPrompt = customPrompt;
      }
    }

    // Diff içeriğini daha iyi yapılandır
    const codeContent = prDetails.files
      .filter((file) => file.patch)
      .map((file) => {
        const fileExtension = file.filename.split('.').pop();
        return `
=== DOSYA: ${file.filename} ===
Durum: ${file.status}
Değişiklik: +${file.additions} -${file.deletions}
Dil: ${fileExtension}

DIFF (Yeni değişiklikler "+" ile başlar):
${file.patch}

---
`;
      })
      .join("\n");

    if (!codeContent.trim()) {
      throw new Error("İncelenecek kod değişikliği bulunamadı");
    }

    // Tool-based structured output kullan (daha güvenilir JSON)
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      temperature: 0.3, // Daha deterministik
      system: systemPrompt,
      tools: [
        {
          name: "submit_review",
          description: "Kod inceleme sonuçlarını yapılandırılmış formatta gönder",
          input_schema: {
            type: "object",
            properties: {
              critical: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    file: { type: "string" },
                    line: { type: "number" },
                    issue: { type: "string" },
                    suggestion: { type: "string" },
                    severity: { 
                      type: "string", 
                      enum: ["high", "medium", "low"] 
                    },
                    labels: { 
                      type: "array", 
                      items: { type: "string" } 
                    },
                  },
                  required: ["file", "line", "issue", "suggestion", "severity", "labels"],
                },
              },
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    file: { type: "string" },
                    line: { type: "number" },
                    issue: { type: "string" },
                    suggestion: { type: "string" },
                    labels: { type: "array", items: { type: "string" } },
                  },
                  required: ["file", "line", "issue", "suggestion", "labels"],
                },
              },
              bestPractices: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    file: { type: "string" },
                    line: { type: "number" },
                    issue: { type: "string" },
                    suggestion: { type: "string" },
                    labels: { type: "array", items: { type: "string" } },
                  },
                  required: ["file", "line", "issue", "suggestion", "labels"],
                },
              },
            },
            required: ["critical", "suggestions", "bestPractices"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_review" },
      messages: [
        {
          role: "user",
          content: `Bu Pull Request'i incele.

PR Başlığı: ${prDetails.title}
PR Açıklaması: ${prDetails.body || "Açıklama yok"}

Değişiklikler:
${codeContent}

HATIRLATMA:
- "+" ile başlayan satırlar ZATEN EKLENMIŞ
- Sadece gerçek sorunları ve iyileştirme fırsatlarını raporla
- Her bulgu için spesifik dosya adı ve satır numarası ver
- Boş array döndürmekte sakınca yok

Label önerileri:
- Security: security, authentication, authorization, xss, sql-injection
- Performance: performance, optimization, memory-leak, n+1-query
- Code Quality: refactor, code-smell, duplication, complexity
- Best Practices: naming, documentation, testing, error-handling
- Accessibility: a11y, wcag
- UI/UX: ui, ux, responsive`,
        },
      ],
    });

    // Tool-based response parse et
    let reviewResult: ReviewResult;
    
    if (message.content[0].type === "tool_use") {
      reviewResult = message.content[0].input as ReviewResult;
    } else {
      throw new Error("Claude yanıtı beklenmeyen formatta");
    }

    // Veritabanını güncelle
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: "COMPLETED",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        critical: reviewResult.critical as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        suggestions: reviewResult.suggestions as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bestPractices: reviewResult.bestPractices as any,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Claude inceleme hatası:", error);
    
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "FAILED" },
    });

    throw error;
  }
}
