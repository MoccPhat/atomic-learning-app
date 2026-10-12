import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFocusPetState,
  saveFocusPetState,
  setActivePet,
  renamePet,
  feedPet,
  rewardFocusMinutes,
  calculatePetStage,
  getStageTitle,
  getRandomQuote,
  FOCUS_PET_STORAGE_KEY,
} from '../lib/focus-pet-storage';
import { PetSpecies, PET_SPECIES_CONFIG } from '../lib/focus-pet-types';

// Mock localStorage
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

describe('Focus Pet Companion Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('khởi tạo đầy đủ 6 loài thú cưng theo yêu cầu (Chó, Mèo, Rùa, Cá, Capybara, Chuột lang)', () => {
    const state = getFocusPetState();
    expect(state).toBeDefined();
    expect(state.treats).toBeGreaterThanOrEqual(5);

    const requiredSpecies: PetSpecies[] = ['dog', 'cat', 'turtle', 'fish', 'capybara', 'hamster'];
    requiredSpecies.forEach((sp) => {
      expect(state.pets[sp]).toBeDefined();
      expect(state.pets[sp].species).toBe(sp);
      expect(state.pets[sp].level).toBe(1);
      expect(state.pets[sp].stage).toBe('baby');
      expect(PET_SPECIES_CONFIG[sp]).toBeDefined();
    });
  });

  it('đổi thú cưng đồng hành sang loài khác thành công', () => {
    let state = getFocusPetState();
    expect(state.activeSpecies).toBe('capybara');

    state = setActivePet('cat');
    expect(state.activeSpecies).toBe('cat');

    state = setActivePet('dog');
    expect(state.activeSpecies).toBe('dog');

    // Kiểm tra tính bền vững trong localStorage
    const saved = JSON.parse(localStorage.getItem(FOCUS_PET_STORAGE_KEY)!);
    expect(saved.activeSpecies).toBe('dog');
  });

  it('đổi tên thú cưng (renamePet) chuẩn xác và bảo toàn ký tự', () => {
    let state = getFocusPetState();
    state = renamePet('dog', 'Hachiko Thông Minh');
    expect(state.pets.dog.name).toBe('Hachiko Thông Minh');

    // Thử với tên có khoảng trắng thừa
    state = renamePet('capybara', '   Bác Bắp Điềm Đạm   ');
    expect(state.pets.capybara.name).toBe('Bác Bắp Điềm Đạm');
  });

  it('cho pet ăn (feedPet) tiêu hao hạt thức ăn, tăng độ no và nhận EXP', () => {
    let state = getFocusPetState();
    state.pets.capybara.hunger = 40;
    state.pets.capybara.happiness = 50;
    saveFocusPetState(state);

    const initialTreats = state.treats;
    const res = feedPet('capybara');

    expect(res.success).toBe(true);
    expect(res.state.treats).toBe(initialTreats - 1);
    expect(res.state.pets.capybara.hunger).toBe(65); // 40 + 25
    expect(res.state.pets.capybara.happiness).toBe(70); // 50 + 20
    expect(res.state.pets.capybara.exp).toBe(20);
  });

  it('báo lỗi khi hết hạt thức ăn (treats = 0)', () => {
    let state = getFocusPetState();
    state.treats = 0;
    saveFocusPetState(state);

    const res = feedPet('cat');
    expect(res.success).toBe(false);
    expect(res.message).toContain('hết hạt thức ăn');
  });

  it('thưởng điểm phiên học tập trung (rewardFocusMinutes) cấp EXP và hạt thức ăn', () => {
    getFocusPetState();
    setActivePet('turtle');

    const focusMinutes = 25;
    const result = rewardFocusMinutes(focusMinutes);

    expect(result.treatsEarned).toBeGreaterThanOrEqual(1);
    expect(result.expEarned).toBe(200); // 25 * 8
    expect(result.state.pets.turtle.totalFocusMinutes).toBe(25);
    expect(result.state.pets.turtle.level).toBeGreaterThanOrEqual(1);
  });

  it('tự động lên cấp (Level Up) và tiến hóa giai đoạn (Stage Evolution)', () => {
    expect(calculatePetStage(1)).toBe('baby');
    expect(calculatePetStage(4)).toBe('baby');
    expect(calculatePetStage(5)).toBe('teen');
    expect(calculatePetStage(14)).toBe('teen');
    expect(calculatePetStage(15)).toBe('adult');
    expect(calculatePetStage(29)).toBe('adult');
    expect(calculatePetStage(30)).toBe('master');

    expect(getStageTitle('baby')).toContain('Sơ sinh');
    expect(getStageTitle('master')).toContain('Master');
  });

  it('sinh câu thoại ngẫu nhiên theo tâm trạng cho tất cả loài thú', () => {
    const speciesList: PetSpecies[] = ['dog', 'cat', 'turtle', 'fish', 'capybara', 'hamster'];
    speciesList.forEach((sp) => {
      const focusQuote = getRandomQuote(sp, 'focusing');
      expect(focusQuote).toBeDefined();
      expect(focusQuote.length).toBeGreaterThan(0);

      const restingQuote = getRandomQuote(sp, 'resting');
      expect(restingQuote).toBeDefined();
    });
  });

  it('phát sự kiện window CustomEvent (focus-pet-updated) khi lưu trạng thái Pet', () => {
    let eventFired = false;
    let detailReceived: any = null;

    const mockWindow = {
      dispatchEvent: (e: any) => {
        eventFired = true;
        detailReceived = e.detail;
      },
    };

    (globalThis as any).window = mockWindow;

    const state = getFocusPetState();
    state.treats = 10;
    saveFocusPetState(state);

    delete (globalThis as any).window;

    expect(eventFired).toBe(true);
    expect(detailReceived).toBeDefined();
    expect(detailReceived.treats).toBe(10);
  });
});
