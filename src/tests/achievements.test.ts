import { describe, it, expect } from 'vitest';
import { calculateUserAchievements } from '../lib/achievements-service';

describe('Achievements and Mastery Badges Service', () => {
  it('tính toán chính xác huy hiệu và cấp bậc người dùng dựa trên chỉ số', () => {
    const stats = {
      streak: 7,
      totalCards: 18,
      gardenTreesCount: 3,
      cornellNotesCount: 4,
      cheatSheetsCount: 13,
      vaultFilesCount: 9,
      highlightsCount: 5,
      completedExamsCount: 2
    };

    const result = calculateUserAchievements(stats);

    expect(result.achievements.length).toBeGreaterThanOrEqual(8);
    // Streak 7 ngày -> Cấp Bạc (Silver)
    const streakBadge = result.achievements.find(a => a.id === 'streak_master');
    expect(streakBadge).toBeDefined();
    expect(streakBadge?.unlocked).toBe(true);
    expect(streakBadge?.tier).toBe('silver');

    // Cây làm vườn 3 cây -> Cấp Bạc (Silver)
    const gardenBadge = result.achievements.find(a => a.id === 'green_thumb');
    expect(gardenBadge?.unlocked).toBe(true);
    expect(gardenBadge?.tier).toBe('silver');

    // Thẻ Flashcards 18 thẻ -> Cấp Bạc (Silver)
    const cardBadge = result.achievements.find(a => a.id === 'flashcard_scholar');
    expect(cardBadge?.unlocked).toBe(true);
    expect(cardBadge?.tier).toBe('silver');

    // Điểm danh dự
    expect(result.totalHonorPoints).toBeGreaterThan(0);
    expect(result.unlockedCount).toBeGreaterThanOrEqual(5);
    expect(['Học Giả Bền Bỉ', 'Cao Thủ Tri Thức', 'Đại Sư Tri Thức']).toContain(result.overallRank);
  });

  it('xử lý người dùng mới chưa có hoạt động nào với cấp bậc Tập Sự Khởi Đầu', () => {
    const stats = {
      streak: 0,
      totalCards: 0,
      gardenTreesCount: 0,
      cornellNotesCount: 0,
      cheatSheetsCount: 0,
      vaultFilesCount: 0,
      highlightsCount: 0,
      completedExamsCount: 0
    };

    const result = calculateUserAchievements(stats);
    expect(result.unlockedCount).toBe(0);
    expect(result.totalHonorPoints).toBe(0);
    expect(result.overallRank).toBe('Tập Sự Khởi Đầu');
  });
});
