import {
  PetSpecies,
  PetStage,
  PetMood,
  PetData,
  FocusPetState,
  PET_SPECIES_CONFIG,
} from './focus-pet-types';

export const FOCUS_PET_STORAGE_KEY = 'atomic_focus_pets_data';

const DEFAULT_SPECIES_LIST: PetSpecies[] = ['capybara', 'dog', 'cat', 'turtle', 'fish', 'hamster'];

export function calculateMaxExp(level: number): number {
  return Math.round(80 + Math.pow(level, 1.4) * 20);
}

export function calculatePetStage(level: number): PetStage {
  if (level < 5) return 'baby';
  if (level < 15) return 'teen';
  if (level < 30) return 'adult';
  return 'master';
}

export function getStageTitle(stage: PetStage): string {
  switch (stage) {
    case 'baby':
      return 'Bé con (Sơ sinh)';
    case 'teen':
      return 'Năng động (Trưởng thành nhẹ)';
    case 'adult':
      return 'Chững chạc (Trưởng thành)';
    case 'master':
      return 'Huyền thoại (Master)';
  }
}

export function createInitialPet(species: PetSpecies): PetData {
  const config = PET_SPECIES_CONFIG[species];
  return {
    id: `pet_${species}_${Date.now()}`,
    species,
    name: config.name,
    level: 1,
    exp: 0,
    maxExp: calculateMaxExp(1),
    stage: 'baby',
    hunger: 80,
    happiness: 90,
    totalFocusMinutes: 0,
    createdAt: new Date().toISOString(),
  };
}

export function createInitialState(): FocusPetState {
  const pets = {} as Record<PetSpecies, PetData>;
  DEFAULT_SPECIES_LIST.forEach((sp) => {
    pets[sp] = createInitialPet(sp);
  });

  return {
    activeSpecies: 'capybara',
    pets,
    treats: 5, // Tặng sẵn 5 hạt dinh dưỡng ban đầu để trải nghiệm
    unlockedSpecies: [...DEFAULT_SPECIES_LIST],
    updatedAt: new Date().toISOString(),
  };
}

export function getFocusPetState(): FocusPetState {
  try {
    if (typeof localStorage === 'undefined') return createInitialState();

    const raw = localStorage.getItem(FOCUS_PET_STORAGE_KEY);
    if (!raw) {
      const init = createInitialState();
      saveFocusPetState(init);
      return init;
    }

    const parsed: FocusPetState = JSON.parse(raw);

    // Đảm bảo đầy đủ 6 loài thú nếu dữ liệu cũ còn thiếu
    let modified = false;
    DEFAULT_SPECIES_LIST.forEach((sp) => {
      if (!parsed.pets || !parsed.pets[sp]) {
        if (!parsed.pets) parsed.pets = {} as Record<PetSpecies, PetData>;
        parsed.pets[sp] = createInitialPet(sp);
        modified = true;
      }
    });

    if (!parsed.activeSpecies || !parsed.pets[parsed.activeSpecies]) {
      parsed.activeSpecies = 'capybara';
      modified = true;
    }

    if (typeof parsed.treats !== 'number') {
      parsed.treats = 5;
      modified = true;
    }

    if (modified) {
      saveFocusPetState(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('Lỗi khi đọc FocusPetState:', error);
    return createInitialState();
  }
}

export function saveFocusPetState(state: FocusPetState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const toSave: FocusPetState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(FOCUS_PET_STORAGE_KEY, JSON.stringify(toSave));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('focus-pet-updated', { detail: toSave }));
    }
  } catch (error) {
    console.error('Lỗi khi lưu FocusPetState:', error);
  }
}

export function setActivePet(species: PetSpecies): FocusPetState {
  const state = getFocusPetState();
  if (state.pets[species]) {
    state.activeSpecies = species;
    saveFocusPetState(state);
  }
  return state;
}

export function renamePet(species: PetSpecies, newName: string): FocusPetState {
  const state = getFocusPetState();
  const trimmed = newName.trim();
  if (state.pets[species] && trimmed.length > 0) {
    state.pets[species].name = trimmed.slice(0, 30);
    saveFocusPetState(state);
  }
  return state;
}

export function feedPet(species?: PetSpecies): {
  state: FocusPetState;
  success: boolean;
  message: string;
  expGained: number;
} {
  const state = getFocusPetState();
  const targetSpecies = species || state.activeSpecies;
  const pet = state.pets[targetSpecies];

  if (!pet) {
    return { state, success: false, message: 'Không tìm thấy thú cưng!', expGained: 0 };
  }

  if (state.treats <= 0) {
    return {
      state,
      success: false,
      message: 'Đã hết hạt thức ăn! Hãy hoàn thành phiên học tập trung để nhận thêm hạt nhé!',
      expGained: 0,
    };
  }

  // Tiêu hao 1 treat
  state.treats -= 1;
  const expGained = 20;

  pet.hunger = Math.min(100, pet.hunger + 25);
  pet.happiness = Math.min(100, pet.happiness + 20);
  pet.lastFedAt = new Date().toISOString();

  // Cộng EXP và kiểm tra lên cấp
  pet.exp += expGained;
  while (pet.exp >= pet.maxExp) {
    pet.exp -= pet.maxExp;
    pet.level += 1;
    pet.maxExp = calculateMaxExp(pet.level);
    pet.stage = calculatePetStage(pet.level);
  }

  saveFocusPetState(state);
  return {
    state,
    success: true,
    message: `${pet.name} đã được ăn no nê và nhận thêm +${expGained} EXP! ❤️`,
    expGained,
  };
}

export function rewardFocusMinutes(minutes: number): {
  state: FocusPetState;
  treatsEarned: number;
  expEarned: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  evolved: boolean;
  oldStage: PetStage;
  newStage: PetStage;
} {
  const state = getFocusPetState();
  const pet = state.pets[state.activeSpecies];

  const treatsEarned = Math.max(1, Math.floor(minutes / 20));
  const expEarned = Math.max(10, Math.round(minutes * 8));

  state.treats += treatsEarned;

  const oldLevel = pet.level;
  const oldStage = pet.stage;

  pet.totalFocusMinutes += minutes;
  pet.happiness = Math.min(100, pet.happiness + 25);
  pet.hunger = Math.max(15, pet.hunger - Math.round(minutes * 0.3));

  pet.exp += expEarned;
  while (pet.exp >= pet.maxExp) {
    pet.exp -= pet.maxExp;
    pet.level += 1;
    pet.maxExp = calculateMaxExp(pet.level);
    pet.stage = calculatePetStage(pet.level);
  }

  const leveledUp = pet.level > oldLevel;
  const evolved = pet.stage !== oldStage;

  saveFocusPetState(state);

  return {
    state,
    treatsEarned,
    expEarned,
    leveledUp,
    oldLevel,
    newLevel: pet.level,
    evolved,
    oldStage,
    newStage: pet.stage,
  };
}

export function getRandomQuote(species: PetSpecies, mood: PetMood): string {
  const config = PET_SPECIES_CONFIG[species];
  const quoteKey =
    mood in config.quotes
      ? (mood as keyof typeof config.quotes)
      : mood === 'sleeping'
      ? 'focusing'
      : mood === 'happy'
      ? 'celebrating'
      : 'idle';
  const list = config.quotes[quoteKey] || config.quotes.idle;
  if (!list || list.length === 0) return 'Cố gắng lên nhé bạn ơi!';
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}
