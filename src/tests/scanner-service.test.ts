import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  getScannerSettings,
  saveScannerSettings,
  buildSystemPrompt,
  analyzeScannedContent,
  cleanScannedLayout,
  ScannerSettings,
} from '../lib/scanner-service';

// Polyfill localStorage cho Vitest môi trường Node
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

describe('Scanner Service & Layout Preserver', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('quản lý Gemini API Key trong LocalStorage chính xác', () => {
    expect(getGeminiApiKey()).toBe('');
    saveGeminiApiKey('AIzaSyTestKey123456');
    expect(getGeminiApiKey()).toBe('AIzaSyTestKey123456');
  });

  it('lưu và nạp cấu hình ScannerSettings mặc định', () => {
    const settings = getScannerSettings();
    expect(settings.engine).toBe('tesseract');
    expect(settings.model).toBe('gemini-3.5-flash');
    expect(settings.preserveLayout).toBe(true);

    const updated: ScannerSettings = {
      engine: 'gemini',
      model: 'gemini-2.0-flash',
      preserveLayout: true,
      autoClassify: false,
    };
    saveScannerSettings(updated);
    expect(getScannerSettings()).toEqual(updated);
  });

  it('tự động migrate model cũ gemini-2.5-flash hoặc gemini-1.5-flash sang gemini-3.5-flash', () => {
    localStorage.setItem('atomic_scanner_settings', JSON.stringify({ model: 'gemini-2.5-flash' }));
    const settings = getScannerSettings();
    expect(settings.model).toBe('gemini-3.5-flash');
    expect(JSON.parse(localStorage.getItem('atomic_scanner_settings') || '{}').model).toBe('gemini-3.5-flash');

    localStorage.setItem('atomic_scanner_settings', JSON.stringify({ model: 'gemini-1.5-flash' }));
    const settings2 = getScannerSettings();
    expect(settings2.model).toBe('gemini-3.5-flash');
    expect(JSON.parse(localStorage.getItem('atomic_scanner_settings') || '{}').model).toBe('gemini-3.5-flash');
  });

  it('tạo system prompt chuẩn chỉ định rõ bảo toàn bố cục, code và công thức toán', () => {
    const prompt = buildSystemPrompt({ preserveLayout: true });
    expect(prompt).toContain('BẢO TOÀN NGUYÊN VẸN 100% BỐ CỤC');
    expect(prompt).toContain('LaTeX');
    expect(prompt).toContain('indentation');
  });

  it('phát hiện đúng loại nội dung (Quiz, Code, Math) từ văn bản trích xuất', () => {
    const quizText = `Câu 1: Hàm số nào sau đây đồng biến trên R?
A. y = x^3
B. y = -x^2
C. y = 1/x
D. y = 2x
Đáp án: A`;

    const analysis1 = analyzeScannedContent(quizText);
    expect(analysis1.isQuiz).toBe(true);
    expect(analysis1.quizCount).toBe(1);

    const codeText = `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        pass`;
    const analysis2 = analyzeScannedContent(codeText);
    expect(analysis2.hasCode).toBe(true);

    const mathText = `Phương trình vi phân: $$\\frac{dy}{dx} + P(x)y = Q(x)$$`;
    const analysis3 = analyzeScannedContent(mathText);
    expect(analysis3.hasMath).toBe(true);
  });

  it('làm sạch văn bản giữ nguyên thụt lề dòng và chuẩn hóa ngắt dòng', () => {
    const raw = "Dòng 1    \r\n    Dòng 2 thụt lề\r\n\r\n\r\n\r\nDòng 3";
    const cleaned = cleanScannedLayout(raw);
    expect(cleaned).toContain("    Dòng 2 thụt lề");
    expect(cleaned.includes('\r')).toBe(false);
  });
});
