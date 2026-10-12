/**
 * Speech Service - Web Speech API synthesis wrapper
 * Tự động phát hiện tiếng Việt/tiếng Anh, quản lý giọng đọc, tốc độ và hàng đợi phát âm
 */

export interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

// Regex phát hiện ký tự tiếng Việt đặc trưng
const VIETNAMESE_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;

/**
 * Phát hiện ngôn ngữ tự nhiên từ nội dung text
 */
export function detectLanguage(text: string): 'vi-VN' | 'en-US' {
  if (!text || typeof text !== 'string') return 'vi-VN';
  if (VIETNAMESE_REGEX.test(text)) {
    return 'vi-VN';
  }
  return 'en-US';
}

/**
 * Lấy danh sách giọng đọc có sẵn từ trình duyệt
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Tìm giọng đọc tối ưu theo mã ngôn ngữ
 */
export function findBestVoice(lang: string, preferredVoiceURI?: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  if (preferredVoiceURI) {
    const matched = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (matched) return matched;
  }

  // Tìm giọng theo tiền tố ngôn ngữ (ví dụ 'vi' hoặc 'en')
  const prefix = lang.slice(0, 2).toLowerCase();
  const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (langMatch) return langMatch;

  return voices[0] || null;
}

/**
 * Đọc văn bản bằng giọng nói Web Speech API
 */
export function speakText(text: string, options: SpeechOptions = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options.onError) options.onError(new Error('SpeechSynthesis not supported'));
    return false;
  }

  if (!text || !text.trim()) {
    if (options.onEnd) options.onEnd();
    return true;
  }

  // Dọn dẹp văn bản trước khi đọc (bỏ cú pháp markdown rườm rà, code backticks, URL)
  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) {
    if (options.onEnd) options.onEnd();
    return true;
  }

  // Hủy âm thanh đang phát trước đó
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  const lang = options.lang || detectLanguage(cleanedText);
  utterance.lang = lang;
  utterance.rate = Math.max(0.5, Math.min(2.0, options.rate || 1.0));
  utterance.pitch = Math.max(0.5, Math.min(1.5, options.pitch || 1.0));

  const bestVoice = findBestVoice(lang, options.voiceURI);
  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = (e) => options.onError!(e);

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Dừng phát âm thanh ngay lập tức
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Tạm dừng / Tiếp tục phát
 */
export function pauseSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
}

/**
 * Làm sạch văn bản để đọc mượt mà tự nhiên
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    // Loại bỏ code blocks ```...```
    .replace(/```[\s\S]*?```/g, ' Đoạn mã lập trình. ')
    // Loại bỏ inline code `...`
    .replace(/`([^`]+)`/g, '$1')
    // Loại bỏ markdown headers, bold, italic
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Loại bỏ markdown link [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Loại bỏ công thức KaTeX $...$ hoặc $$...$$
    .replace(/\$\$[\s\S]*?\$\$/g, ' Công thức toán học. ')
    .replace(/\$([^$]+)\$/g, '$1')
    // Thu gọn khoảng trắng thừa
    .replace(/\s+/g, ' ')
    .trim();
}
