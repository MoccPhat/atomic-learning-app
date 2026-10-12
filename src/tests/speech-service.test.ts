import { describe, it, expect } from 'vitest';
import { detectLanguage, cleanTextForSpeech } from '../lib/speech-service';

describe('Speech Service Logic', () => {
  describe('detectLanguage', () => {
    it('nhận diện chính xác văn bản Tiếng Việt có dấu', () => {
      expect(detectLanguage('Học tập ngắt quãng giúp ghi nhớ lâu')).toBe('vi-VN');
      expect(detectLanguage('Định lý Pythagoras')).toBe('vi-VN');
      expect(detectLanguage('Xin chào thế giới')).toBe('vi-VN');
    });

    it('nhận diện văn bản Tiếng Anh không có dấu', () => {
      expect(detectLanguage('Spaced Repetition System')).toBe('en-US');
      expect(detectLanguage('What is asynchronous programming in JavaScript?')).toBe('en-US');
      expect(detectLanguage('Big O notation and algorithms')).toBe('en-US');
    });

    it('xử lý an toàn chuỗi rỗng hoặc falsy', () => {
      expect(detectLanguage('')).toBe('vi-VN');
      expect(detectLanguage(null as any)).toBe('vi-VN');
    });
  });

  describe('cleanTextForSpeech', () => {
    it('loại bỏ code blocks markdown và thay bằng mô tả ngắn gọn', () => {
      const input = 'Ví dụ hàm tính tổng:\n```python\ndef add(a, b):\n    return a + b\n```\nKết quả trả về tổng hai số.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).toContain('Đoạn mã lập trình.');
      expect(cleaned).not.toContain('def add');
    });

    it('loại bỏ inline backticks và giữ lại từ', () => {
      const input = 'Sử dụng hàm `console.log()` để in kết quả.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).toBe('Sử dụng hàm console.log() để in kết quả.');
    });

    it('loại bỏ markdown headers và in đậm/in nghiêng', () => {
      const input = '### Tiêu đề bài học\nĐây là văn bản **rất quan trọng** và *chú ý*.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).toBe('Tiêu đề bài học Đây là văn bản rất quan trọng và chú ý.');
    });

    it('loại bỏ công thức toán KaTeX $$...$$', () => {
      const input = 'Công thức tính diện tích: $$S = \\pi r^2$$ với bán kính r.';
      const cleaned = cleanTextForSpeech(input);
      expect(cleaned).toContain('Công thức toán học.');
      expect(cleaned).not.toContain('\\pi');
    });

    it('xử lý an toàn chuỗi rỗng', () => {
      expect(cleanTextForSpeech('')).toBe('');
      expect(cleanTextForSpeech(null as any)).toBe('');
    });
  });
});
