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
    lineRange: string;
    issue: string;
    suggestion: string;
    severity: "high" | "medium" | "low";
    labels: string[];
  }>;
  suggestions: Array<{
    file: string;
    lineRange: string;
    issue: string;
    suggestion: string;
    labels: string[];
  }>;
  bestPractices: Array<{
    file: string;
    lineRange: string;
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

    // Parse diff to extract actual line numbers
    const parseDiffLineNumbers = (patch: string) => {
      const lines = patch.split('\n');
      const lineInfo: Array<{lineNum: number, content: string, type: 'add' | 'remove' | 'context'}> = [];
      let currentLine = 0;
      
      for (const line of lines) {
        // Parse @@ header to get starting line number
        const headerMatch = line.match(/^@@\s+-\d+,?\d*\s+\+(\d+),?\d*\s+@@/);
        if (headerMatch) {
          currentLine = parseInt(headerMatch[1]);
          continue;
        }
        
        if (line.startsWith('+')) {
          lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'add' });
          currentLine++;
        } else if (line.startsWith('-')) {
          lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'remove' });
          // Don't increment for deletions
        } else if (line.startsWith(' ')) {
          lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'context' });
          currentLine++;
        }
      }
      
      return lineInfo;
    };

    // Diff içeriğini satır numaralarıyla zenginleştir
    const codeContent = prDetails.files
      .filter((file) => file.patch)
      .map((file) => {
        const fileExtension = file.filename.split('.').pop();
        const lineInfo = parseDiffLineNumbers(file.patch || '');
        
        // Format with line numbers
        let formattedDiff = '';
        lineInfo.forEach((info) => {
          const prefix = info.type === 'add' ? '+' : info.type === 'remove' ? '-' : ' ';
          formattedDiff += `${info.lineNum.toString().padStart(4, ' ')} ${prefix} ${info.content}\n`;
        });
        
        return `
=== DOSYA: ${file.filename} ===
Durum: ${file.status}
Değişiklik: +${file.additions} -${file.deletions}
Dil: ${fileExtension}

DIFF (Satır numaraları ile, "+" = yeni eklenen):
${formattedDiff}
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
                    file: { type: "string", description: "Dosya yolu" },
                    lineRange: { type: "string", description: "Satır aralığı, örn: '92-98' veya tek satır için '95'" },
                    issue: { type: "string", description: "Sorunun açıklaması" },
                    suggestion: { type: "string", description: "Çözüm önerisi" },
                    severity: { 
                      type: "string", 
                      enum: ["high", "medium", "low"] 
                    },
                    labels: { 
                      type: "array", 
                      items: { type: "string" } 
                    },
                  },
                  required: ["file", "lineRange", "issue", "suggestion", "severity", "labels"],
                },
              },
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    file: { type: "string", description: "Dosya yolu" },
                    lineRange: { type: "string", description: "Satır aralığı, örn: '92-98' veya tek satır için '95'" },
                    issue: { type: "string", description: "Sorunun açıklaması" },
                    suggestion: { type: "string", description: "Çözüm önerisi" },
                    labels: { type: "array", items: { type: "string" } },
                  },
                  required: ["file", "lineRange", "issue", "suggestion", "labels"],
                },
              },
              bestPractices: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    file: { type: "string", description: "Dosya yolu" },
                    lineRange: { type: "string", description: "Satır aralığı, örn: '92-98' veya tek satır için '95'" },
                    issue: { type: "string", description: "Sorunun açıklaması" },
                    suggestion: { type: "string", description: "Çözüm önerisi" },
                    labels: { type: "array", items: { type: "string" } },
                  },
                  required: ["file", "lineRange", "issue", "suggestion", "labels"],
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

ÖNEMLI NOTLAR:
- Her satırın başında GERÇEK satır numarası gösteriliyor
- "+" ile başlayan satırlar ZATEN EKLENMIŞ yeni kod
- Sadece gerçek sorunları ve iyileştirme fırsatlarını raporla
- 'lineRange' alanına sorunun olduğu satır aralığını yaz (örn: "92-98" veya tek satır için "95")
- Diff'te gösterilen satır numaralarını kullan
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
