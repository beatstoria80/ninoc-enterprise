import type { PlatformMetrics, MetaDemographics, MetaOrganicData } from './types';

export class MetaMetricsCalculator {
  static sanitizeOrganicError(rawMessage: string): string {
    const lower = rawMessage.toLowerCase();

    if (lower.includes('does not exist') || lower.includes('missing permissions') || lower.includes('unsupported get request')) {
      return 'Token API belum memiliki izin yang cukup untuk membaca data Halaman ini. ' +
        'Pastikan token memiliki izin pages_show_list dan pages_read_engagement, ' +
        'lalu tambahkan ulang Halaman di Meta Business Settings. Data yang ditampilkan adalah simulasi.';
    }

    if (lower.includes('session has expired') || lower.includes('invalid oauth') || lower.includes('access token')) {
      return 'Token akses Meta telah kedaluwarsa atau tidak valid. ' +
        'Silakan perbarui META_CAPI_TOKEN di pengaturan environment. Data yang ditampilkan adalah simulasi.';
    }

    if (lower.includes('rate limit') || lower.includes('too many calls')) {
      return 'Batas pemanggilan API Meta tercapai. Coba refresh kembali dalam beberapa menit. ' +
        'Data yang ditampilkan sementara adalah simulasi.';
    }

    if (lower.includes('valid insights metric') || lower.includes('deprecated')) {
      return 'Beberapa metrik insights sudah tidak didukung oleh versi API saat ini. ' +
        'Data yang ditampilkan adalah simulasi.';
    }

    return 'Terjadi kendala saat menghubungi Facebook API. Data yang ditampilkan adalah simulasi. ' +
      'Periksa konfigurasi token dan izin di Meta Business Settings.';
  }

  static getPurchasesCount(actions: any[] | undefined): number {
    if (!actions || !Array.isArray(actions)) return 0;
    const purchaseAction = actions.find(
      (a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
    );
    return purchaseAction ? parseInt(purchaseAction.value || 0, 10) : 0;
  }

  static getAdsDatePreset(timeFilter: string): string {
    switch (timeFilter) {
      case '24h': return 'today';
      case '7d': return 'last_7d';
      case '90d': return 'last_90d';
      case 'all': return 'maximum';
      default: return 'last_28d';
    }
  }

  static getOrganicUnixRange(timeFilter: string): { sinceUnix: number; untilUnix: number; days: number } {
    const until = new Date();
    const since = new Date();
    let days = 28;

    switch (timeFilter) {
      case '24h': days = 1; break;
      case '7d': days = 7; break;
      case '90d': days = 90; break;
      default: days = 28; break;
    }
    
    since.setDate(until.getDate() - days);

    return {
      sinceUnix: Math.floor(since.getTime() / 1000),
      untilUnix: Math.floor(until.getTime() / 1000),
      days
    };
  }

  static getEmptyPlatformMetrics(days: number): PlatformMetrics {
    const trend: { date: string; reach: number; engagement: number }[] = [];

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trend.push({
        date: d.toISOString().split('T')[0],
        reach: 0,
        engagement: 0
      });
    }

    return {
      followers: 0,
      reach: 0,
      profileViews: 0,
      engagement: 0,
      trend,
      topPosts: [],
      engagementRate: 0,
      avgReachPerPost: 0,
      growthRate: 0,
      bestDay: '-',
      contentScore: 0,
      strategicInsights: []
    };
  }

  static getEmptyOrganicData(timeFilter: string): MetaOrganicData {
    const { days } = this.getOrganicUnixRange(timeFilter);
    return {
      configured: true,
      instagram: this.getEmptyPlatformMetrics(days),
      facebook: this.getEmptyPlatformMetrics(days)
    };
  }

  static parseDemographics(demoData: any[]): MetaDemographics {
    const ageGenderMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    let totalDemo = 0;

    const ageGenderVal = demoData.find((d: any) => d.name === 'audience_gender_age' || d.name === 'page_fans_gender_age')?.values?.[0]?.value || {};
    
    Object.entries(ageGenderVal).forEach(([key, val]) => {
      const value = typeof val === 'number' ? val : 0;
      const mappedKey = key.replace('F.', 'Perempuan ').replace('M.', 'Laki-laki ').replace('U.', 'Lainnya ');
      ageGenderMap.set(mappedKey, (ageGenderMap.get(mappedKey) || 0) + value);
      totalDemo += value;
    });

    const cityVal = demoData.find((d: any) => d.name === 'audience_city' || d.name === 'page_fans_city')?.values?.[0]?.value || {};
    
    Object.entries(cityVal).forEach(([key, val]) => {
      const value = typeof val === 'number' ? val : 0;
      const city = key.split(',')[0].trim();
      cityMap.set(city, (cityMap.get(city) || 0) + value);
    });

    const topAgeGender = Array.from(ageGenderMap.entries())
      .map(([segment, count]) => ({ segment, percentage: totalDemo > 0 ? (count / totalDemo) * 100 : 0 }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    const topLocations = Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, percentage: totalDemo > 0 ? (count / totalDemo) * 100 : 0 }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    return { ageGender: topAgeGender, topLocations };
  }

  static computeDerivedMetrics(metrics: PlatformMetrics): void {
    const postCount = metrics.topPosts.length || 1;

    metrics.engagementRate = metrics.followers > 0
      ? parseFloat(((metrics.engagement / metrics.followers) * 100).toFixed(2))
      : 0;

    metrics.avgReachPerPost = Math.round(metrics.reach / postCount);

    if (metrics.trend.length >= 2) {
      const firstReach = metrics.trend[0].reach;
      const lastReach = metrics.trend[metrics.trend.length - 1].reach;
      metrics.growthRate = firstReach > 0
        ? parseFloat((((lastReach - firstReach) / firstReach) * 100).toFixed(1))
        : 0;
    }

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayEngagement: Record<string, number> = {};
    metrics.trend.forEach(t => {
      const dayOfWeek = dayNames[new Date(t.date).getDay()];
      if (dayOfWeek) {
        dayEngagement[dayOfWeek] = (dayEngagement[dayOfWeek] || 0) + t.engagement;
      }
    });
    const sortedDays = Object.entries(dayEngagement).sort((a, b) => b[1] - a[1]);
    metrics.bestDay = sortedDays.length > 0 ? sortedDays[0][0] : '-';

    const totalLikes = metrics.topPosts.reduce((sum, p) => sum + p.likes, 0);
    const totalComments = metrics.topPosts.reduce((sum, p) => sum + p.comments, 0);
    metrics.contentScore = metrics.reach > 0
      ? parseFloat((((totalLikes + totalComments * 3) / metrics.reach) * 100).toFixed(2))
      : 0;

    const insights: string[] = [];

    if (metrics.engagementRate < 1 && metrics.followers > 0) {
      insights.push('⚠️ Engagement rate di bawah rata-rata industri (< 1%). Coba gunakan CTA di caption dan posting lebih banyak Reels/Video pendek.');
    } else if (metrics.engagementRate >= 3) {
      insights.push('🔥 Engagement rate sangat baik (≥ 3%)! Audiens Anda sangat aktif. Pertahankan jenis konten ini.');
    }

    if (metrics.trend.length >= 3) {
      const last3 = metrics.trend.slice(-3);
      if (last3[0].reach > last3[1].reach && last3[1].reach > last3[2].reach) {
        insights.push('📉 Reach menurun 3 hari berturut-turut. Pertimbangkan konten carousel, kolaborasi, atau Reels untuk meningkatkan jangkauan.');
      }
    }

    if (metrics.profileViews > metrics.followers * 0.5 && metrics.followers < 1000) {
      insights.push('👀 Banyak yang mengunjungi profil tapi belum follow. Optimalkan bio, highlight stories, dan pinned post untuk meningkatkan konversi.');
    }

    if (metrics.topPosts.length > 0) {
      const bestPost = [...metrics.topPosts].sort((a, b) => (b.likes + b.comments * 3) - (a.likes + a.comments * 3))[0];
      if (bestPost && (bestPost.likes > 0 || bestPost.comments > 0)) {
        const cleanCaption = bestPost.caption.replace(/\.\.\.$/, '').trim();
        insights.push(`🏆 Konten "${cleanCaption || 'tanpa caption'}" mendapat performa terbaik. Buat lebih banyak konten serupa.`);
      }
    }

    if (metrics.growthRate > 5) {
      insights.push('🚀 Pertumbuhan audiens sangat bagus (> 5%)! Strategi konten saat ini efektif.');
    } else if (metrics.growthRate < -5) {
      insights.push('📉 Pertumbuhan negatif terdeteksi. Evaluasi ulang frekuensi dan jenis konten yang diposting.');
    }

    if (metrics.bestDay !== '-') {
      insights.push(`📅 Hari terbaik untuk posting: ${metrics.bestDay}. Prioritaskan jadwal konten di hari ini.`);
    }

    metrics.strategicInsights = insights;
  }
}
