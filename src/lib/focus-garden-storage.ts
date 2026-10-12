import { GardenTree, TreeSpecies, TREE_SPECIES_INFO, GardenStats } from './focus-garden-types';

const GARDEN_STORAGE_KEY = 'atomic_focus_garden_trees';

export const INITIAL_GARDEN_TREES: GardenTree[] = [
  {
    id: 'tree-seed-1',
    species: 'oak',
    speciesName: 'Cây Sồi Tri Thức',
    stage: 'blooming',
    focusMinutes: 45,
    subjectName: 'Lập trình Python',
    plantedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'tree-seed-2',
    species: 'lotus',
    speciesName: 'Hoa Sen Thiền Định',
    stage: 'blooming',
    focusMinutes: 25,
    subjectName: 'IELTS Vocabulary',
    plantedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tree-seed-3',
    species: 'bamboo',
    speciesName: 'Cây Tre Bền Bỉ',
    stage: 'blooming',
    focusMinutes: 30,
    subjectName: 'Cấu trúc dữ liệu',
    plantedAt: new Date().toISOString(),
  },
];

/**
 * Lấy toàn bộ cây trong khu vườn từ LocalStorage (mặc định rỗng để người dùng tự trồng cây từ đầu)
 */
export function getGardenTrees(): GardenTree[] {
  try {
    const raw = localStorage.getItem(GARDEN_STORAGE_KEY);
    if (!raw) {
      saveGardenTrees([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Lỗi khi nạp cây khu vườn:', e);
    return [];
  }
}

/**
 * Lưu danh sách cây vào LocalStorage
 */
export function saveGardenTrees(trees: GardenTree[]): void {
  try {
    localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(trees));
  } catch (e) {
    console.error('Lỗi khi lưu cây khu vườn:', e);
  }
}

/**
 * Trồng cây mới khi kết thúc phiên Pomodoro thành công
 */
export function plantCompletedTree(
  durationMinutes: number,
  subjectName?: string,
  preferredSpecies?: TreeSpecies
): GardenTree {
  const trees = getGardenTrees();

  // Nếu không chọn loài cây, chọn ngẫu nhiên
  const speciesList: TreeSpecies[] = ['oak', 'lotus', 'bamboo', 'sakura', 'cactus', 'bonsai'];
  const species = preferredSpecies || speciesList[Math.floor(Math.random() * speciesList.length)];

  const newTree: GardenTree = {
    id: `tree-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    species,
    speciesName: TREE_SPECIES_INFO[species].name,
    stage: 'blooming',
    focusMinutes: durationMinutes,
    subjectName: subjectName || 'Tự do tập trung',
    plantedAt: new Date().toISOString(),
  };

  trees.unshift(newTree);
  saveGardenTrees(trees);
  return newTree;
}

/**
 * Ghi nhận một cây bị héo úa do bỏ dở phiên học
 */
export function recordWitheredTree(
  durationMinutes: number,
  subjectName?: string
): GardenTree {
  const trees = getGardenTrees();
  const speciesList: TreeSpecies[] = ['oak', 'bamboo', 'cactus'];
  const species = speciesList[Math.floor(Math.random() * speciesList.length)];

  const witheredTree: GardenTree = {
    id: `tree-withered-${Date.now()}`,
    species,
    speciesName: TREE_SPECIES_INFO[species].name,
    stage: 'withered',
    focusMinutes: durationMinutes,
    subjectName: subjectName || 'Phiên dở dang',
    plantedAt: new Date().toISOString(),
  };

  trees.unshift(witheredTree);
  saveGardenTrees(trees);
  return witheredTree;
}

/**
 * Tính toán thống kê và cấp bậc Nhà Làm Vườn
 */
export function getGardenStats(): GardenStats {
  const trees = getGardenTrees();
  const harvested = trees.filter((t) => t.stage === 'blooming');
  const withered = trees.filter((t) => t.stage === 'withered');
  const totalMinutes = harvested.reduce((sum, t) => sum + t.focusMinutes, 0);

  // Cấp độ làm vườn dựa trên số cây nở hoa
  let level = 'Người Gieo Mầm (Level 1)';
  let progress = Math.min(100, (harvested.length / 5) * 100);

  if (harvested.length >= 30) {
    level = 'Phù Thủy Rừng Xanh (Level 5)';
    progress = 100;
  } else if (harvested.length >= 15) {
    level = 'Thần Nông Tri Thức (Level 4)';
    progress = Math.min(100, ((harvested.length - 15) / 15) * 100);
  } else if (harvested.length >= 8) {
    level = 'Nghệ Nhân Bonsai (Level 3)';
    progress = Math.min(100, ((harvested.length - 8) / 7) * 100);
  } else if (harvested.length >= 4) {
    level = 'Người Chăm Vườn (Level 2)';
    progress = Math.min(100, ((harvested.length - 4) / 4) * 100);
  }

  return {
    totalHarvested: harvested.length,
    totalWithered: withered.length,
    totalFocusMinutes: totalMinutes,
    gardenerLevel: level,
    levelProgress: Math.round(progress),
  };
}
