export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'garden' | 'cards' | 'cornell' | 'cheatsheet' | 'vault' | 'highlights' | 'exam';
  unlocked: boolean;
  tier: BadgeTier | 'locked';
  currentValue: number;
  targets: {
    bronze: number;
    silver: number;
    gold: number;
  };
  currentProgressPct: number;
  tierLabel: string;
  honorPoints: number;
}

export interface AchievementInputStats {
  streak: number;
  totalCards: number;
  gardenTreesCount: number;
  cornellNotesCount: number;
  cheatSheetsCount: number;
  vaultFilesCount: number;
  highlightsCount: number;
  completedExamsCount: number;
}

export interface UserAchievementOverview {
  achievements: AchievementBadge[];
  totalHonorPoints: number;
  overallRank: string;
  unlockedCount: number;
  totalCount: number;
  completionRate: number;
}

interface BadgeConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementBadge['category'];
  statKey: keyof AchievementInputStats;
  targets: {
    bronze: number;
    silver: number;
    gold: number;
  };
}

const BADGE_CONFIGS: BadgeConfig[] = [
  {
    id: 'streak_master',
    title: 'Ngọn Lửa Bất Diệt',
    description: 'Duy trì chuỗi ngày học tập liên tục (Streak)',
    icon: '🔥',
    category: 'streak',
    statKey: 'streak',
    targets: { bronze: 3, silver: 7, gold: 30 }
  },
  {
    id: 'green_thumb',
    title: 'Bậc Thầy Làm Vườn',
    description: 'Trồng thành công các cây Pomodoro trong Khu vườn ảo',
    icon: '🌲',
    category: 'garden',
    statKey: 'gardenTreesCount',
    targets: { bronze: 1, silver: 3, gold: 10 }
  },
  {
    id: 'flashcard_scholar',
    title: 'Trí Nhớ Siêu Phàm',
    description: 'Tích lũy và làm chủ bộ thẻ học tập Spaced Repetition',
    icon: '🧠',
    category: 'cards',
    statKey: 'totalCards',
    targets: { bronze: 5, silver: 15, gold: 50 }
  },
  {
    id: 'cornell_author',
    title: 'Học Giả Cornell',
    description: 'Biên soạn các bài ghi chú chất lượng theo phương pháp Cornell 3 vùng',
    icon: '📝',
    category: 'cornell',
    statKey: 'cornellNotesCount',
    targets: { bronze: 1, silver: 3, gold: 10 }
  },
  {
    id: 'quick_reference',
    title: 'Bách Khoa Bỏ Túi',
    description: 'Tích lũy các công thức và cú pháp thực chiến trong Cheat Sheet',
    icon: '⚡',
    category: 'cheatsheet',
    statKey: 'cheatSheetsCount',
    targets: { bronze: 5, silver: 10, gold: 25 }
  },
  {
    id: 'vault_keeper',
    title: 'Thủ Thư Tri Thức',
    description: 'Tổ chức kho tệp tin và giáo trình phân loại trong Vault',
    icon: '📚',
    category: 'vault',
    statKey: 'vaultFilesCount',
    targets: { bronze: 3, silver: 8, gold: 20 }
  },
  {
    id: 'deep_miner',
    title: 'Khai Thác Tinh Hoa',
    description: 'Đánh dấu bút nhớ các trích dẫn đắt giá từ tài liệu',
    icon: '💡',
    category: 'highlights',
    statKey: 'highlightsCount',
    targets: { bronze: 1, silver: 5, gold: 15 }
  },
  {
    id: 'exam_conqueror',
    title: 'Chiến Thần Phòng Thi',
    description: 'Thử sức và hoàn thành các bài thi mô phỏng Mock Exam',
    icon: '🎯',
    category: 'exam',
    statKey: 'completedExamsCount',
    targets: { bronze: 1, silver: 2, gold: 5 }
  }
];

export function calculateUserAchievements(stats: AchievementInputStats): UserAchievementOverview {
  let totalHonorPoints = 0;
  let unlockedCount = 0;

  const achievements: AchievementBadge[] = BADGE_CONFIGS.map((config) => {
    const val = stats[config.statKey] || 0;
    let tier: BadgeTier | 'locked' = 'locked';
    let tierLabel = 'Chưa mở';
    let points = 0;

    if (val >= config.targets.gold) {
      tier = 'gold';
      tierLabel = 'Huy Chương Vàng';
      points = 200;
    } else if (val >= config.targets.silver) {
      tier = 'silver';
      tierLabel = 'Huy Chương Bạc';
      points = 100;
    } else if (val >= config.targets.bronze) {
      tier = 'bronze';
      tierLabel = 'Huy Chương Đồng';
      points = 50;
    }

    const unlocked = tier !== 'locked';
    if (unlocked) {
      unlockedCount += 1;
      totalHonorPoints += points;
    }

    // Tính % tiến độ tới mốc kế tiếp (hoặc mốc vàng nếu đã hoàn thành)
    const nextTarget = tier === 'locked' 
      ? config.targets.bronze 
      : tier === 'bronze' 
        ? config.targets.silver 
        : config.targets.gold;
    const progressPct = Math.min(100, Math.round((val / nextTarget) * 100));

    return {
      id: config.id,
      title: config.title,
      description: config.description,
      icon: config.icon,
      category: config.category,
      unlocked,
      tier,
      currentValue: val,
      targets: config.targets,
      currentProgressPct: progressPct,
      tierLabel,
      honorPoints: points
    };
  });

  // Xác định danh hiệu tổng quan (Overall Rank)
  let overallRank = 'Tập Sự Khởi Đầu';
  if (totalHonorPoints >= 1000) {
    overallRank = 'Đại Sư Tri Thức';
  } else if (totalHonorPoints >= 500) {
    overallRank = 'Cao Thủ Tri Thức';
  } else if (totalHonorPoints >= 200) {
    overallRank = 'Học Giả Bền Bỉ';
  } else if (unlockedCount > 0) {
    overallRank = 'Tân Binh Tiềm Năng';
  }

  const completionRate = Math.round((unlockedCount / BADGE_CONFIGS.length) * 100);

  return {
    achievements,
    totalHonorPoints,
    overallRank,
    unlockedCount,
    totalCount: BADGE_CONFIGS.length,
    completionRate
  };
}
