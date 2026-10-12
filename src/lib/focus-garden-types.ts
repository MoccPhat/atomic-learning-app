export type TreeSpecies = 'oak' | 'lotus' | 'bamboo' | 'sakura' | 'cactus' | 'bonsai';
export type TreeStage = 'sprout' | 'sapling' | 'growing' | 'budding' | 'blooming' | 'withered';

export interface GardenTree {
  id: string;
  species: TreeSpecies;
  speciesName: string;
  stage: TreeStage;
  focusMinutes: number;
  subjectName?: string;
  plantedAt: string; // ISO Date String
}

export interface GardenStats {
  totalHarvested: number;
  totalWithered: number;
  totalFocusMinutes: number;
  gardenerLevel: string;
  levelProgress: number; // 0 - 100%
}

export const TREE_SPECIES_INFO: Record<
  TreeSpecies,
  { name: string; icon: string; description: string; color: string }
> = {
  oak: {
    name: 'Cây Sồi Tri Thức',
    icon: '🌳',
    description: 'Biểu tượng của sức mạnh học hỏi và tư duy bền vững.',
    color: 'emerald',
  },
  lotus: {
    name: 'Hoa Sen Thiền Định',
    icon: '🪷',
    description: 'Biểu tượng của sự tĩnh tâm, không bị xao nhãng.',
    color: 'pink',
  },
  bamboo: {
    name: 'Cây Tre Bền Bỉ',
    icon: '🎋',
    description: 'Biểu tượng của kỷ luật bền bỉ, dẻo dai trước thử thách.',
    color: 'green',
  },
  sakura: {
    name: 'Hoa Anh Đào Tươi Sáng',
    icon: '🌸',
    description: 'Biểu tượng của niềm vui sáng tạo và cảm hứng học tập.',
    color: 'rose',
  },
  cactus: {
    name: 'Xương Rồng Kiên Cường',
    icon: '🌵',
    description: 'Biểu tượng của khả năng vượt khó trong những bài học gai góc.',
    color: 'amber',
  },
  bonsai: {
    name: 'Bonsai Tinh Tế',
    icon: '🪴',
    description: 'Biểu tượng của sự tập trung sâu sắc, trau chuốt từng chi tiết.',
    color: 'teal',
  },
};
