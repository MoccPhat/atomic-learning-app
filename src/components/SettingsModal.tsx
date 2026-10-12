import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  Palette,
  Sun,
  Moon,
  Laptop,
  ExternalLink,
  Zap,
  Sparkles,
  Undo2,
  Save,
  Database,
  HeartHandshake,
} from 'lucide-react';
import { exportDataAsJSON, importDataFromJSON, resetToSeedData } from '../lib/storage';
import {
  applyTheme,
  getStoredTheme,
  saveThemePermanently,
  ThemeMode,
  ContrastMode,
  ThemeSettings,
  LIGHT_PRESETS,
  DARK_PRESETS,
  GRADIENT_DESCENT_PRESETS,
} from '../lib/theme';
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  getScannerSettings,
  saveScannerSettings,
} from '../lib/scanner-service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  onOpenFeedback?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onDataChanged, onOpenFeedback }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'appearance' | 'ai' | 'data'>('appearance');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Trạng thái Theme (chỉnh sửa trực tiếp với live preview)
  const [theme, setTheme] = useState<ThemeSettings>(() => getStoredTheme());
  const [isSaved, setIsSaved] = useState(false);

  // Trạng thái AI & Scanner API
  const [apiKey, setApiKey] = useState(() => getGeminiApiKey());
  const [scannerSettings, setScannerSettings] = useState(() => getScannerSettings());
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Nạp lại theme từ storage khi mở modal
  useEffect(() => {
    if (isOpen) {
      const current = getStoredTheme();
      setTheme(current);
      setApiKey(getGeminiApiKey());
      setScannerSettings(getScannerSettings());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Cập nhật và xem trước live ngay lập tức
  const updateAndPreviewTheme = (newTheme: ThemeSettings) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setIsSaved(false);
  };

  // 1. Thay đổi Theme Mode (System, Light, Dark)
  const handleModeChange = (mode: ThemeMode) => {
    const updated = { ...theme, mode };
    updateAndPreviewTheme(updated);
  };

  // 2. Thay đổi Contrast (Default, Strong)
  const handleContrastChange = (contrast: ContrastMode) => {
    const updated = { ...theme, contrast };
    updateAndPreviewTheme(updated);
  };

  // 3. Thay đổi màu sắc Light Theme
  const handleLightColorChange = (key: 'bg' | 'fg' | 'accent', value: string) => {
    const updated: ThemeSettings = {
      ...theme,
      lightScheme: {
        ...theme.lightScheme,
        [key]: value,
        preset: 'custom',
      },
    };
    updateAndPreviewTheme(updated);
  };

  const handleLightPresetChange = (presetKey: string) => {
    const preset = LIGHT_PRESETS[presetKey];
    if (!preset) return;
    const updated: ThemeSettings = {
      ...theme,
      lightScheme: {
        preset: presetKey,
        bg: preset.bg,
        fg: preset.fg,
        accent: preset.accent,
      },
    };
    updateAndPreviewTheme(updated);
  };

  const handleResetLight = () => {
    handleLightPresetChange('default-light');
  };

  // 4. Thay đổi màu sắc Dark Theme
  const handleDarkColorChange = (key: 'bg' | 'fg' | 'accent', value: string) => {
    const updated: ThemeSettings = {
      ...theme,
      darkScheme: {
        ...theme.darkScheme,
        [key]: value,
        preset: 'custom',
      },
    };
    updateAndPreviewTheme(updated);
  };

  const handleDarkPresetChange = (presetKey: string) => {
    const preset = DARK_PRESETS[presetKey];
    if (!preset) return;
    const updated: ThemeSettings = {
      ...theme,
      darkScheme: {
        preset: presetKey,
        bg: preset.bg,
        fg: preset.fg,
        accent: preset.accent,
      },
    };
    updateAndPreviewTheme(updated);
  };

  const handleResetDark = () => {
    handleDarkPresetChange('default-dark');
  };

  // 5. Thay đổi Gradient Descent
  const handleToggleGradient = (enabled: boolean) => {
    const updated: ThemeSettings = {
      ...theme,
      gradient: {
        ...theme.gradient,
        enabled,
      },
    };
    updateAndPreviewTheme(updated);
  };

  const handleGradientTypeChange = (type: any) => {
    const updated: ThemeSettings = {
      ...theme,
      gradient: {
        ...theme.gradient,
        type,
      },
    };
    updateAndPreviewTheme(updated);
  };

  // 6. Nút LƯU CÀI ĐẶT DÍNH CỨNG VĨNH VIỄN
  const handleSaveThemePermanently = () => {
    saveThemePermanently(theme);
    applyTheme(theme);
    setIsSaved(true);
    setMessage({
      text: '✓ Đã lưu cài đặt giao diện dính cứng vĩnh viễn! Mọi màu sắc và dải Gradient sẽ được duy trì cho các lần sau.',
      type: 'success',
    });
    setTimeout(() => {
      setIsSaved(false);
      setMessage(null);
    }, 4000);
  };

  // Export / Import / Reset data
  const handleExport = () => {
    try {
      const dataStr = exportDataAsJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atomic-learning-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ text: 'Đã xuất file sao lưu thành công!', type: 'success' });
    } catch {
      setMessage({ text: 'Lỗi khi xuất file sao lưu', type: 'error' });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importDataFromJSON(content);
        if (success) {
          setMessage({ text: 'Đã phục hồi dữ liệu thành công!', type: 'success' });
          onDataChanged();
        } else {
          setMessage({ text: 'File sao lưu không hợp lệ hoặc bị lỗi', type: 'error' });
        }
      } catch {
        setMessage({ text: 'Lỗi khi đọc file JSON', type: 'error' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    resetToSeedData();
    setMessage({ text: 'Đã đặt lại dữ liệu mẫu ban đầu thành công!', type: 'success' });
    setConfirmReset(false);
    onDataChanged();
  };

  const handleSaveAIConfig = () => {
    saveGeminiApiKey(apiKey);
    saveScannerSettings(scannerSettings);
    setApiKeySaved(true);
    setMessage({ text: 'Đã lưu cấu hình Gemini API Key thành công!', type: 'success' });
    setTimeout(() => setApiKeySaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Appearance & Cài đặt
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Configure the agent's visual theme and display preferences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'appearance'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Giao diện & Màu sắc</span>
            {activeTab === 'appearance' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>AI Vision Scanner</span>
            {activeTab === 'ai' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'data'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Dữ liệu & Sao lưu</span>
            {activeTab === 'data' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {message && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* SECTION 1: APPEARANCE (THEME & CONTRAST) */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase">
                  Appearance
                </span>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Theme Mode Toggle (Segmented Control) */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme</span>
                    <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleModeChange('system')}
                        className={`p-2 rounded-lg transition-all ${
                          theme.mode === 'system'
                            ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                        title="Tự động theo hệ thống (Windows / Mobile)"
                      >
                        <Laptop className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange('light')}
                        className={`p-2 rounded-lg transition-all ${
                          theme.mode === 'light'
                            ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                        title="Giao diện Sáng (Light Theme)"
                      >
                        <Sun className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange('dark')}
                        className={`p-2 rounded-lg transition-all ${
                          theme.mode === 'dark'
                            ? 'bg-white dark:bg-slate-900 text-indigo-400 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                        title="Giao diện Tối (Dark Theme)"
                      >
                        <Moon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contrast Toggle (Segmented Control) */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Contrast</span>
                    <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleContrastChange('default')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          theme.contrast === 'default'
                            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        Default
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContrastChange('strong')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          theme.contrast === 'strong'
                            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        Strong
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LIGHT THEME CUSTOMIZATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light Theme</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Tùy biến bảng màu sáng</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Preset Dropdown */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Preset</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetLight}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Đặt lại preset ban đầu"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                      <select
                        value={theme.lightScheme.preset}
                        onChange={(e) => handleLightPresetChange(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {Object.entries(LIGHT_PRESETS).map(([k, p]) => (
                          <option key={k} value={k}>
                            {p.label}
                          </option>
                        ))}
                        {theme.lightScheme.preset === 'custom' && (
                          <option value="custom">Tùy chỉnh (Custom)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Background</span>
                    <div className="flex items-center gap-2">
                      <label className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs relative shrink-0 block">
                        <input
                          type="color"
                          value={theme.lightScheme.bg}
                          onChange={(e) => handleLightColorChange('bg', e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.lightScheme.bg }}
                        />
                      </label>
                      <input
                        type="text"
                        value={theme.lightScheme.bg}
                        onChange={(e) => handleLightColorChange('bg', e.target.value)}
                        className="w-24 px-2.5 py-1 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Foreground Color */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Foreground</span>
                    <div className="flex items-center gap-2">
                      <label className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs relative shrink-0 block">
                        <input
                          type="color"
                          value={theme.lightScheme.fg}
                          onChange={(e) => handleLightColorChange('fg', e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.lightScheme.fg }}
                        />
                      </label>
                      <input
                        type="text"
                        value={theme.lightScheme.fg}
                        onChange={(e) => handleLightColorChange('fg', e.target.value)}
                        className="w-24 px-2.5 py-1 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Accent</span>
                    <div className="flex items-center gap-2">
                      <label className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs relative shrink-0 block">
                        <input
                          type="color"
                          value={theme.lightScheme.accent}
                          onChange={(e) => handleLightColorChange('accent', e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.lightScheme.accent }}
                        />
                      </label>
                      <input
                        type="text"
                        value={theme.lightScheme.accent}
                        onChange={(e) => handleLightColorChange('accent', e.target.value)}
                        className="w-24 px-2.5 py-1 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DARK THEME CUSTOMIZATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dark Theme</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Tùy biến bảng màu tối</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Preset Dropdown */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Preset</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetDark}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Đặt lại preset ban đầu"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                      <select
                        value={theme.darkScheme.preset}
                        onChange={(e) => handleDarkPresetChange(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {Object.entries(DARK_PRESETS).map(([k, p]) => (
                          <option key={k} value={k}>
                            {p.label}
                          </option>
                        ))}
                        {theme.darkScheme.preset === 'custom' && (
                          <option value="custom">Tùy chỉnh (Custom)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Background</span>
                    <div className="flex items-center gap-2">
                      <label className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs relative shrink-0 block">
                        <input
                          type="color"
                          value={theme.darkScheme.bg}
                          onChange={(e) => handleDarkColorChange('bg', e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.darkScheme.bg }}
                        />
                      </label>
                      <input
                        type="text"
                        value={theme.darkScheme.bg}
                        onChange={(e) => handleDarkColorChange('bg', e.target.value)}
                        className="w-24 px-2.5 py-1 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Foreground Color */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Foreground</span>
                    <div className="flex items-center gap-2">
                      <label className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs relative shrink-0 block">
                        <input
                          type="color"
                          value={theme.darkScheme.fg}
                          onChange={(e) => handleDarkColorChange('fg', e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.darkScheme.fg }}
                        />
                      </label>
                      <input
                        type="text"
                        value={theme.darkScheme.fg}
                        onChange={(e) => handleDarkColorChange('fg', e.target.value)}
                        className="w-24 px-2.5 py-1 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Accent</span>
                    <div className="flex items-center gap-2">
                      <label className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer shadow-xs relative shrink-0 block">
                        <input
                          type="color"
                          value={theme.darkScheme.accent}
                          onChange={(e) => handleDarkColorChange('accent', e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: theme.darkScheme.accent }}
                        />
                      </label>
                      <input
                        type="text"
                        value={theme.darkScheme.accent}
                        onChange={(e) => handleDarkColorChange('accent', e.target.value)}
                        className="w-24 px-2.5 py-1 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: HIỆU ỨNG GRADIENT DESCENT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                      <span>Hiệu ứng Gradient Descent</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Trải dải màu Gradient Descent mượt mà bao phủ toàn bộ không gian làm việc.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleGradient(!theme.gradient.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      theme.gradient.enabled ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        theme.gradient.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {theme.gradient.enabled && (
                  <div className="p-4 rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/20 dark:bg-brand-950/20 space-y-3 animate-fade-in">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Chọn kiểu dải Gradient Descent:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {GRADIENT_DESCENT_PRESETS.map((p) => {
                        const isSelected = theme.gradient.type === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleGradientTypeChange(p.id)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <span>{p.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>AI Vision & Quét Tài Liệu</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Lấy key miễn phí</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Gemini API Key
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                    />
                    <button
                      onClick={handleSaveAIConfig}
                      className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0"
                    >
                      {apiKeySaved ? 'Đã lưu!' : 'Lưu Key'}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Bảo toàn bố cục & Bảng biểu (Layout Preserver)
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        Giữ nguyên bảng tính, định dạng code và công thức toán LaTeX
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setScannerSettings((s) => ({
                          ...s,
                          preserveLayout: !s.preserveLayout,
                        }))
                      }
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        scannerSettings.preserveLayout ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          scannerSettings.preserveLayout ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-3">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase">
                Quản lý dữ liệu & Đồng bộ
              </span>

              <div className="space-y-2">
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Xuất file sao lưu (JSON)
                      </span>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                        Tải toàn bộ thẻ, bộ đề và streak về máy
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:bg-sky-50/20 dark:hover:bg-sky-950/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Nhập dữ liệu (JSON)
                      </span>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                        Khôi phục thẻ từ file đã sao lưu
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".json"
                    className="hidden"
                  />
                </button>

                <button
                  onClick={handleReset}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all group ${
                    confirmReset
                      ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-rose-400 hover:bg-rose-50/20 dark:hover:bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        confirmReset
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <span
                        className={`block text-xs font-bold ${
                          confirmReset
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {confirmReset ? '⚠️ Bấm lần nữa để xác nhận đặt lại!' : 'Đặt lại dữ liệu mẫu'}
                      </span>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                        {confirmReset
                          ? 'Thao tác này sẽ đặt lại thẻ về dữ liệu mẫu ban đầu'
                          : 'Khôi phục các thẻ mẫu ban đầu'}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === 'appearance' && (
              <button
                onClick={handleSaveThemePermanently}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-black shadow-md shadow-brand-500/25 active:scale-95 transition-all flex items-center gap-2"
                title="Lưu dính cứng vĩnh viễn vào LocalStorage"
              >
                <Save className="w-4 h-4" />
                <span>{isSaved ? '✓ Đã lưu dính cứng!' : 'Lưu cài đặt (Dính cứng vĩnh viễn)'}</span>
              </button>
            )}

            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Gửi phản hồi hoặc báo lỗi cho tác giả (phat7971@gmail.com)"
              >
                <HeartHandshake className="w-4 h-4 text-rose-500" />
                <span>Đánh giá / Báo lỗi</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
