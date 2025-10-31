import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { subDays, startOfWeek, endOfWeek, subWeeks } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Tarih aralıklarını belirle
    const now = new Date();
    let weekStart: Date;
    let weekEnd: Date;
    let lastWeekStart: Date;
    let lastWeekEnd: Date;
    
    if (startDateParam && endDateParam) {
      // Özel tarih aralığı - tarihleri parse et
      try {
        weekStart = new Date(startDateParam + 'T00:00:00.000Z');
        weekEnd = new Date(endDateParam + 'T23:59:59.999Z');
        
        // Tarih validasyonu
        if (isNaN(weekStart.getTime()) || isNaN(weekEnd.getTime())) {
          throw new Error('Invalid date format');
        }
        
        // Gelecek tarihleri engelle
        if (weekStart > now || weekEnd > now) {
          return NextResponse.json(
            { error: "Cannot select future dates" },
            { status: 400 }
          );
        }
        
        // Başlangıç tarihi bitiş tarihinden sonra olamaz
        if (weekStart > weekEnd) {
          return NextResponse.json(
            { error: "Start date cannot be after end date" },
            { status: 400 }
          );
        }
        
        // Önceki periyot için aynı uzunlukta bir aralık hesapla
        const diff = weekEnd.getTime() - weekStart.getTime();
        lastWeekEnd = new Date(weekStart.getTime() - 1);
        lastWeekStart = new Date(lastWeekEnd.getTime() - diff);
      } catch (error) {
        console.error('Date parsing error:', error);
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
    } else {
      // Varsayılan: bu hafta
      weekStart = startOfWeek(now);
      weekEnd = endOfWeek(now);
      lastWeekStart = startOfWeek(subWeeks(now, 1));
      lastWeekEnd = endOfWeek(subWeeks(now, 1));
    }

    // Toplam review sayısı
    const totalReviews = await prisma.review.count({
      where: { userId: user.id },
    });

    // Bu hafta
    const thisWeekReviews = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Geçen hafta
    const lastWeekReviews = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: lastWeekStart,
          lte: lastWeekEnd,
        },
      },
    });

    // Review değişim yüzdesi
    const reviewsChangePercent = lastWeekReviews === 0 
      ? 100 
      : Math.round(((thisWeekReviews - lastWeekReviews) / lastWeekReviews) * 100);

    // Kritik issue sayısı
    const criticalIssuesCount = await prisma.review.count({
      where: {
        userId: user.id,
        critical: {
          not: Prisma.JsonNull,
        },
      },
    });

    // Bu hafta kritik issues
    const thisWeekCritical = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        critical: {
          not: Prisma.JsonNull,
        },
      },
    });

    // Geçen hafta kritik issues
    const lastWeekCritical = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: lastWeekStart,
          lte: lastWeekEnd,
        },
        critical: {
          not: Prisma.JsonNull,
        },
      },
    });

    const criticalChangePercent = lastWeekCritical === 0 
      ? (thisWeekCritical > 0 ? 100 : 0)
      : Math.round(((thisWeekCritical - lastWeekCritical) / lastWeekCritical) * 100);

    // AI kullanım oranı (completed reviews / total reviews)
    const completedReviews = await prisma.review.count({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
    });

    const aiUsageRate = totalReviews === 0 
      ? 0 
      : Math.round((completedReviews / totalReviews) * 100);

    // Bu hafta completed
    const thisWeekCompleted = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: "COMPLETED",
      },
    });

    // Geçen hafta completed
    const lastWeekCompleted = await prisma.review.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: lastWeekStart,
          lte: lastWeekEnd,
        },
        status: "COMPLETED",
      },
    });

    const usageChangePercent = lastWeekCompleted === 0 
      ? (thisWeekCompleted > 0 ? 100 : 0)
      : Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100);

    // Review type dağılımı
    const reviewsByType = await prisma.review.groupBy({
      by: ['reviewType'],
      where: { userId: user.id },
      _count: true,
    });

    const reviewTypeDistribution = reviewsByType.map(item => ({
      type: item.reviewType,
      count: item._count,
      percentage: totalReviews === 0 ? 0 : Math.round((item._count / totalReviews) * 100),
    }));

    // Trend verisi - son 7 gün veya seçilen aralık
    let trendDays: Date[];
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam + 'T00:00:00.000Z');
      const end = new Date(endDateParam + 'T23:59:59.999Z');
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const numPoints = Math.min(Math.max(daysDiff + 1, 2), 30); // Min 2, Max 30 nokta
      
      if (numPoints === 1) {
        // Tek gün seçilmişse o günü göster
        trendDays = [start];
      } else {
        trendDays = Array.from({ length: numPoints }, (_, i) => 
          new Date(start.getTime() + (i * (end.getTime() - start.getTime()) / (numPoints - 1)))
        );
      }
    } else {
      trendDays = Array.from({ length: 7 }, (_, i) => subDays(now, 6 - i));
    }
    
    const trendsData = await Promise.all(
      trendDays.map(async (day) => {
        const dayStart = new Date(day.setHours(0, 0, 0, 0));
        const dayEnd = new Date(day.setHours(23, 59, 59, 999));
        
        const count = await prisma.review.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            status: "COMPLETED",
          },
        });
        
        return {
          date: dayStart.toISOString(),
          count,
        };
      })
    );

    return NextResponse.json({
      totalReviews,
      reviewsChangePercent,
      criticalIssuesCount,
      criticalChangePercent,
      aiUsageRate,
      usageChangePercent,
      reviewTypeDistribution,
      trendsData,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
