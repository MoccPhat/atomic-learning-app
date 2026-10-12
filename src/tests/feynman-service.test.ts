import { describe, it, expect } from 'vitest';
import { evaluateFeynmanOffline } from '../lib/feynman-service';

describe('Feynman Socratic Engine', () => {
  it('đánh giá lời giải thích có ví dụ đời thường và từ ngữ bình dị', () => {
    const topic = 'Bộ nhớ đệm (Cache)';
    const explanation =
      'Nó giống như chiếc ngăn bàn làm việc của bạn. Thay vì mỗi lần cần sách lại phải chạy vào kho thư viện xa xôi để lấy, bạn để sẵn vài cuốn sách hay đọc ngay trên bàn làm việc để mở ra ngay lập tức.';

    const critique = evaluateFeynmanOffline(topic, explanation);
    expect(critique.score).toBeGreaterThanOrEqual(70);
    expect(critique.strengths.some((s) => s.includes('ví dụ'))).toBe(true);
    expect(critique.socraticQuestions.length).toBe(2);
    expect(critique.isAiGenerated).toBe(false);
  });

  it('nhận diện các thuật ngữ đao to búa lớn (Jargon Alert)', () => {
    const topic = 'Xử lý bất đồng bộ';
    const explanation =
      'Nó sử dụng cơ chế bất đồng bộ và đa luồng để tối ưu hóa độ phức tạp và latency của hệ thống mạng.';

    const critique = evaluateFeynmanOffline(topic, explanation);
    expect(critique.jargons.length).toBeGreaterThanOrEqual(2);
    expect(critique.jargons).toContain('bất đồng bộ');
    expect(critique.jargons).toContain('đa luồng');
    expect(critique.misconceptions.some((m) => m.includes('ví dụ'))).toBe(true);
  });

  it('cảnh báo khi lời giải thích quá ngắn', () => {
    const topic = 'Biến (Variable)';
    const explanation = 'Nó là nơi lưu giá trị.';

    const critique = evaluateFeynmanOffline(topic, explanation);
    expect(critique.misconceptions.some((m) => m.includes('quá ngắn'))).toBe(true);
    expect(critique.score).toBeLessThanOrEqual(60);
  });
});
