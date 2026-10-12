import { createWorker } from 'tesseract.js';
import { parseMarkdownQuiz } from './quiz-parser';

export type ScannerEngine = 'gemini' | 'tesseract';

export interface ScannerSettings {
  engine: ScannerEngine;
  model: string;
  preserveLayout: boolean;
  autoClassify: boolean;
}

const STORAGE_KEYS = {
  API_KEY: 'atomic_gemini_api_key',
  SETTINGS: 'atomic_scanner_settings',
};

const DEFAULT_SETTINGS: ScannerSettings = {
  engine: 'tesseract',
  model: 'gemini-3.5-flash',
  preserveLayout: true,
  autoClassify: true,
};

/**
 * Lấy Gemini API Key được lưu trong trình duyệt
 */
export function getGeminiApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Lưu Gemini API Key vào LocalStorage
 */
export function saveGeminiApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  } catch (e) {
    console.error('Lỗi khi lưu Gemini API Key:', e);
  }
}

/**
 * Lấy cài đặt Scanner hiện tại
 */
export function getScannerSettings(): ScannerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    // Tự động nâng cấp model cũ không còn khả dụng sang gemini-3.5-flash
    if (parsed.model === 'gemini-2.5-flash' || parsed.model === 'gemini-1.5-flash' || !parsed.model) {
      parsed.model = 'gemini-3.5-flash';
      saveScannerSettings(parsed);
    }
    return parsed;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Lưu cài đặt Scanner
 */
export function saveScannerSettings(settings: ScannerSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Lỗi khi lưu ScannerSettings:', e);
  }
}

/**
 * Xây dựng System Prompt tối ưu hóa cho Vision AI bảo toàn 100% bố cục
 */
export function buildSystemPrompt(options?: {
  preserveLayout?: boolean;
  customInstructions?: string;
}): string {
  const base = `Bạn là một chuyên gia số hóa tài liệu học tập cao cấp (High-Accuracy Document OCR & Layout AI).
Nhiệm vụ của bạn là trích xuất TOÀN BỘ văn bản từ hình ảnh được cung cấp và BẢO TOÀN NGUYÊN VẸN 100% BỐ CỤC:

1. BẢO TOÀN NGUYÊN VẸN BỐ CỤC:
   - Giữ nguyên từng dòng ngắt, khoảng cách thụt lề (indentation), khoảng cách giữa các khối chữ.
   - Giữ nguyên các tiêu đề (Heading Markdown: #, ##, ###), danh sách gạch đầu dòng (- / *) và danh sách đánh số (1., 2.).

2. MÃ NGUỒN (CODE):
   - Nếu tài liệu chứa code lập trình, BẮT BUỘC giữ nguyên từng dấu cách thụt dòng (indentation 2 spaces hoặc 4 spaces), dấu ngoặc và cấu trúc.
   - Bọc code trong khối markdown với tên ngôn ngữ tương ứng (ví dụ: \`\`\`python, \`\`\`typescript, \`\`\`cpp).

3. TOÁN HỌC, VẬT LÝ, HÓA HỌC:
   - Chuyển toàn bộ công thức toán học, biểu thức vi phân, tích phân, phân số, ma trận sang chuẩn LaTeX/KaTeX:
     * Dùng $...$ cho công thức nằm trong dòng văn bản (inline).
     * Dùng $$...$$ cho công thức đứng độc lập một dòng riêng (block math).

4. ĐỀ THI TRẮC NGHIỆM:
   - Nếu là đề thi/câu hỏi ôn tập, giữ đúng cấu trúc từng phương án trên từng dòng riêng:
     Câu 1: [Nội dung câu hỏi]
     A. [Nội dung phương án A]
     B. [Nội dung phương án B]
     C. [Nội dung phương án C]
     D. [Nội dung phương án D]
     Đáp án: [Nếu trong ảnh có đánh dấu hoặc ghi đáp án]
     Giải thích: [Nếu trong ảnh có lời giải]

5. BẢNG BIỂU (TABLE):
   - Chuyển bảng trong ảnh thành Markdown Table chuẩn (| Cột 1 | Cột 2 |).

6. CHỮ VIẾT TAY:
   - Nhận diện chính xác ngữ cảnh tiếng Việt (dấu thanh rõ ràng) hoặc tiếng Anh của chữ viết tay.

LƯU Ý QUAN TRỌNG:
- KHÔNG tự ý tóm tắt bớt chữ.
- KHÔNG thêm lời chào, KHÔNG thêm lời mở đầu như "Dưới đây là nội dung...", KHÔNG thêm lời kết.
- Chỉ trả về duy nhất nội dung văn bản đã được số hóa chính xác theo đúng bố cục.`;

  if (options?.customInstructions?.trim()) {
    return `${base}\n\nYÊU CẦU BỔ SUNG CỦA NGƯỜI DÙNG:\n${options.customInstructions.trim()}`;
  }

  return base;
}

/**
 * Chuẩn hóa và làm sạch văn bản sau khi quét:
 * - Chuyển đổi \r\n thành \n
 * - Bỏ trailing whitespace ở cuối mỗi dòng nhưng giữ nguyên thụt lề đầu dòng
 * - Rút gọn các dòng trống liên tiếp vượt quá 3 dòng xuống còn 2 dòng
 */
export function cleanScannedLayout(text: string): string {
  if (!text) return '';
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, '')) // Chỉ bỏ dấu cách thừa ở cuối dòng, giữ nguyên đầu dòng
    .join('\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

  // Chuẩn hóa câu hỏi trắc nghiệm OCR (Ví dụ: "Cau 1." hay "Câu 1 -" thành "Câu 1:")
  cleaned = cleaned.replace(/^([Cc][aââ]u\s*\d+)\s*[\.:-]\s*/gm, '$1: ');
  // Đảm bảo các phương án A. B. C. D. có dòng riêng nếu bị dính hàng
  cleaned = cleaned.replace(/([ \t]+)([A-D]\s*[\.:\)])\s*/g, '\n$2 ');

  return cleaned;
}

/**
 * Phân tích nội dung trích xuất để phát hiện loại tài liệu
 */
export function analyzeScannedContent(text: string): {
  isQuiz: boolean;
  hasCode: boolean;
  hasMath: boolean;
  quizCount: number;
} {
  const { questions } = parseMarkdownQuiz(text);
  const isQuiz = questions.length > 0;
  
  // Phát hiện code block hoặc cú pháp lập trình rõ ràng
  const hasCode =
    /```[\s\S]*?```/.test(text) ||
    /^(def |function |const |let |var |class |import |export |#include |public class )/m.test(text);

  // Phát hiện công thức LaTeX toán học
  const hasMath =
    /\$\$[\s\S]*?\$\$/.test(text) ||
    /\$[^$\n]+\$/.test(text) ||
    /\\(frac|sqrt|sum|int|alpha|beta|theta|partial)/.test(text);

  return {
    isQuiz,
    hasCode,
    hasMath,
    quizCount: questions.length,
  };
}

/**
 * Trích xuất văn bản từ hình ảnh bằng Google Gemini Vision API
 */
export async function extractTextWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  modelName: string = 'gemini-3.5-flash',
  customInstructions?: string
): Promise<string> {
  if (!apiKey?.trim()) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng nhập API Key để sử dụng AI Vision.');
  }

  // Chuyển đổi model cũ không còn khả dụng sang gemini-3.5-flash
  const effectiveModel =
    modelName === 'gemini-2.5-flash' || modelName === 'gemini-1.5-flash'
      ? 'gemini-3.5-flash'
      : modelName;

  // Tách header data:image/...;base64, nếu có
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const cleanMime = mimeType || 'image/jpeg';

  const systemInstruction = buildSystemPrompt({ customInstructions });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    effectiveModel
  )}:generateContent?key=${apiKey.trim()}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: systemInstruction,
          },
          {
            inlineData: {
              mimeType: cleanMime,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1, // Nhiệt độ thấp để nhận diện trung thực và chính xác nhất
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }

    // Nếu model trả về lỗi 404 (model không tồn tại/bị deprecated) hoặc 503 (spike) và không phải gemini-3.5-flash, tự động thử lại với gemini-3.5-flash
    if ((response.status === 404 || response.status === 503) && effectiveModel !== 'gemini-3.5-flash') {
      console.warn(`Model ${effectiveModel} trả về ${response.status}, tự động fallback sang gemini-3.5-flash...`);
      return extractTextWithGemini(base64Data, mimeType, apiKey, 'gemini-3.5-flash', customInstructions);
    }

    // Nếu gemini-3.5-flash gặp 503 tạm thời, thử fallback sang gemini-flash-latest
    if (response.status === 503 && effectiveModel === 'gemini-3.5-flash') {
      console.warn('Gemini 3.5 Flash tạm thời bận, thử fallback sang gemini-flash-latest...');
      return extractTextWithGemini(base64Data, mimeType, apiKey, 'gemini-flash-latest', customInstructions);
    }

    throw new Error(`Lỗi từ Gemini API (${response.status}): ${errorDetail}`);
  }

  const result = await response.json();
  const textOutput =
    result?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';

  if (!textOutput.trim()) {
    throw new Error('Không nhận diện được nội dung văn bản nào từ hình ảnh này.');
  }

  return cleanScannedLayout(textOutput);
}

/**
 * Trích xuất văn bản ngoại tuyến qua Tesseract.js (chạy 100% trong trình duyệt)
 */
export async function extractTextWithTesseract(
  imageSource: string | File | Blob,
  onProgress?: (percent: number, status: string) => void
): Promise<string> {
  try {
    if (onProgress) onProgress(10, 'Đang khởi tạo bộ máy OCR Tesseract...');

    const worker = await createWorker('vie+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress && typeof m.progress === 'number') {
          const percent = Math.min(99, Math.round(m.progress * 80) + 15);
          onProgress(percent, `Đang nhận diện ký tự: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    if (onProgress) onProgress(30, 'Đang xử lý hình ảnh và cấu trúc văn bản...');

    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    if (onProgress) onProgress(100, 'Hoàn thành!');

    return cleanScannedLayout(ret.data.text);
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error(
      `Lỗi khi chạy OCR ngoại tuyến: ${
        error instanceof Error ? error.message : String(error)
      }. Bạn có thể chuyển sang chế độ AI Vision để xử lý chính xác hơn.`
    );
  }
}
