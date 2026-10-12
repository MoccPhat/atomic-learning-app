export type ThemeMode = 'system' | 'dark' | 'light';
export type AccentColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'custom';
export type ContrastMode = 'default' | 'strong';

export interface ColorScheme {
  preset: string;
  bg: string;
  fg: string;
  accent: string;
}

export interface GradientDescentSettings {
  enabled: boolean;
  type: 'cosmic' | 'aurora' | 'sunset' | 'cyberpunk' | 'emerald' | 'custom';
}

export interface ThemeSettings {
  mode: ThemeMode;
  contrast: ContrastMode;
  accent: AccentColor;
  lightScheme: ColorScheme;
  darkScheme: ColorScheme;
  gradient: GradientDescentSettings;
}

const STORAGE_KEY_THEME = 'atomic_learning_theme_settings';

export const ACCENT_COLORS: { key: AccentColor; label: string; previewHex: string }[] = [
  { key: 'emerald', label: 'Xanh ngọc lục bảo (Mặc định)', previewHex: '#16a34a' },
  { key: 'blue', label: 'Xanh dương biển sâu', previewHex: '#2563eb' },
  { key: 'purple', label: 'Tím hoàng gia sang trọng', previewHex: '#9333ea' },
  { key: 'amber', label: 'Cam hổ phách ấm áp', previewHex: '#d97706' },
  { key: 'rose', label: 'Đỏ hồng phấn năng động', previewHex: '#e11d48' },
];

export const LIGHT_PRESETS: Record<string, { label: string; bg: string; fg: string; accent: string }> = {
  'default-light': { label: 'Default Light', bg: '#F8FAFC', fg: '#0F172A', accent: '#16A34A' },
  'pure-white': { label: 'Pure White (Trắng tinh)', bg: '#FFFFFF', fg: '#090D16', accent: '#2563EB' },
  'warm-paper': { label: 'Warm Paper (Giấy ngà dịu mắt)', bg: '#FAF6ED', fg: '#2C2621', accent: '#D97706' },
  'soft-nordic': { label: 'Soft Nordic (Bắc Âu thanh lịch)', bg: '#EEF2F6', fg: '#1E293B', accent: '#7C3AED' },
};

export const DARK_PRESETS: Record<string, { label: string; bg: string; fg: string; accent: string }> = {
  'default-dark': { label: 'Default Dark', bg: '#090D16', fg: '#FFFFFF', accent: '#22C55E' },
  'midnight-slate': { label: 'Midnight Slate (Đêm xanh)', bg: '#0F172A', fg: '#F8FAFC', accent: '#38BDF8' },
  'amoled-black': { label: 'AMOLED Black (Đen OLED tuyệt đối)', bg: '#000000', fg: '#FFFFFF', accent: '#FFC799' },
  'cyberpunk': { label: 'Cyberpunk (Công nghệ)', bg: '#0C0A1D', fg: '#E2E8F0', accent: '#F43F5E' },
  'deep-charcoal': { label: 'Deep Charcoal (Than đá cao cấp)', bg: '#18181B', fg: '#FAFAFA', accent: '#F59E0B' },
};

export const GRADIENT_DESCENT_PRESETS = [
  { id: 'cosmic', label: '🌌 Cosmic Descent (Vũ trụ huyền ảo)', gradient: 'linear-gradient(135deg, #070a14 0%, #1e1035 50%, #0b192c 100%)' },
  { id: 'aurora', label: '✨ Aurora Descent (Cực quang Bắc cực)', gradient: 'linear-gradient(135deg, #021a1e 0%, #064e3b 50%, #0b132b 100%)' },
  { id: 'sunset', label: '🌅 Sunset Twilight (Hoàng hôn tím cam)', gradient: 'linear-gradient(135deg, #1f0b24 0%, #3e122b 50%, #0b1329 100%)' },
  { id: 'cyberpunk', label: '⚡ Cyberpunk Neon (Ánh điện tử đêm)', gradient: 'linear-gradient(135deg, #0a0118 0%, #160840 50%, #231145 100%)' },
  { id: 'emerald', label: '🍃 Emerald Matrix (Ngọc bích Matrix)', gradient: 'linear-gradient(135deg, #011d17 0%, #043f30 50%, #020b14 100%)' },
  { id: 'custom', label: '🎨 Gradient Descent tự phối (Từ màu của bạn)', gradient: '' },
];

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'system',
  contrast: 'default',
  accent: 'emerald',
  lightScheme: {
    preset: 'default-light',
    bg: '#F8FAFC',
    fg: '#0F172A',
    accent: '#16A34A',
  },
  darkScheme: {
    preset: 'default-dark',
    bg: '#090D16',
    fg: '#FFFFFF',
    accent: '#22C55E',
  },
  gradient: {
    enabled: false,
    type: 'cosmic',
  },
};

export function getStoredTheme(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEME);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode || 'system',
        contrast: parsed.contrast || 'default',
        accent: parsed.accent || 'emerald',
        lightScheme: {
          preset: parsed.lightScheme?.preset || 'default-light',
          bg: parsed.lightScheme?.bg || '#F8FAFC',
          fg: parsed.lightScheme?.fg || '#0F172A',
          accent: parsed.lightScheme?.accent || '#16A34A',
        },
        darkScheme: {
          preset: parsed.darkScheme?.preset || 'default-dark',
          bg: parsed.darkScheme?.bg || '#090D16',
          fg: parsed.darkScheme?.fg || '#FFFFFF',
          accent: parsed.darkScheme?.accent || '#22C55E',
        },
        gradient: {
          enabled: Boolean(parsed.gradient?.enabled),
          type: parsed.gradient?.type || 'cosmic',
        },
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_THEME_SETTINGS;
}

export function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement;

  // 1. Áp dụng Mode (Dark / Light / System)
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = settings.mode === 'dark' || (settings.mode === 'system' && isSystemDark);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 2. Áp dụng Contrast
  if (settings.contrast === 'strong') {
    root.classList.add('contrast-strong');
  } else {
    root.classList.remove('contrast-strong');
  }

  // 3. Lấy Color Scheme tương ứng với Mode đang bật
  const activeScheme = isDark ? settings.darkScheme : settings.lightScheme;

  // Gán biến CSS cho nền, chữ và màu nhấn
  root.style.setProperty('--app-bg', activeScheme.bg);
  root.style.setProperty('--app-fg', activeScheme.fg);
  root.style.setProperty('--app-accent', activeScheme.accent);

  // Cập nhật các biến CSS màu Brand (hỗ trợ cả hex tùy ý)
  root.style.setProperty('--brand-500', activeScheme.accent);
  root.style.setProperty('--brand-600', activeScheme.accent);
  root.style.setProperty('--brand-700', activeScheme.accent);
  root.style.setProperty('--brand-100', activeScheme.accent + '26'); // ~15% opacity
  root.style.setProperty('--brand-50', activeScheme.accent + '14'); // ~8% opacity

  root.setAttribute('data-accent', settings.accent);

  // 4. Áp dụng Hiệu ứng Gradient Descent
  if (settings.gradient?.enabled) {
    let grad = '';
    const presetFound = GRADIENT_DESCENT_PRESETS.find((p) => p.id === settings.gradient.type);
    if (presetFound && presetFound.gradient) {
      grad = presetFound.gradient;
    } else {
      // Tự động phối gradient descent từ màu Background và Accent
      grad = `linear-gradient(135deg, ${activeScheme.bg} 0%, ${activeScheme.accent}26 50%, ${activeScheme.bg} 100%)`;
    }
    root.style.setProperty('--app-gradient', grad);
    root.classList.add('has-gradient');
  } else {
    root.style.setProperty('--app-gradient', 'none');
    root.classList.remove('has-gradient');
  }

  // 5. Lưu dính cứng vào LocalStorage
  saveThemePermanently(settings);
}

/**
 * Lưu dính cứng vĩnh viễn cấu hình giao diện vào LocalStorage
 */
export function saveThemePermanently(settings: ThemeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(settings));
  } catch (e) {
    console.error('Không lưu được theme vào LocalStorage:', e);
  }
}

/**
 * Đăng ký lắng nghe thay đổi theme hệ điều hành
 */
export function setupSystemThemeListener(onSystemChange: () => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    const current = getStoredTheme();
    if (current.mode === 'system') {
      applyTheme(current);
      onSystemChange();
    }
  };

  mediaQuery.addEventListener('change', listener);
  return () => mediaQuery.removeEventListener('change', listener);
}
