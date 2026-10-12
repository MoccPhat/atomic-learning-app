import { describe, it, expect, vi } from 'vitest';
import {
  getDeviceDiagnostics,
  generateMailtoLink,
  generateClipboardReport,
  sendFeedbackViaFormSubmit,
  TARGET_EMAIL,
  FeedbackData,
} from '../lib/feedback-service';

describe('Feedback Service Tests', () => {
  const sampleFeedback: FeedbackData = {
    type: 'bug',
    rating: 4,
    userName: 'Thử Nghiệm Viên',
    userEmail: 'tester@example.com',
    title: 'Lỗi tràn màn hình trên Safari',
    description: 'Thanh cuộn ngang xuất hiện khi mở bảng nhiệt.',
    includeDiagnostics: true,
  };

  it('thu thập thông số chẩn đoán thiết bị cơ bản', () => {
    const diag = getDeviceDiagnostics();
    expect(diag).toBeDefined();
    expect(diag.timestamp).toBeDefined();
    expect(typeof diag.isPWA).toBe('boolean');
    expect(typeof diag.online).toBe('boolean');
  });

  it('tạo link mailto chuẩn chứa đầy đủ thông tin lỗi và email nhận', () => {
    const mailto = generateMailtoLink(sampleFeedback);
    expect(mailto).toContain(`mailto:${TARGET_EMAIL}`);
    expect(mailto).toContain(encodeURIComponent('Lỗi tràn màn hình trên Safari'));
    expect(mailto).toContain(encodeURIComponent('Thử Nghiệm Viên'));
  });

  it('tạo báo cáo văn bản để sao chép Zalo/Telegram chuẩn định dạng', () => {
    const report = generateClipboardReport(sampleFeedback);
    expect(report).toContain('[AUTO LEARNING FEEDBACK]');
    expect(report).toContain('Lỗi tràn màn hình trên Safari');
    expect(report).toContain('4/5 sao');
    expect(report).toContain('Thử Nghiệm Viên');
    expect(report).toContain('Thanh cuộn ngang xuất hiện khi mở bảng nhiệt.');
  });

  it('gửi phản hồi thành công qua FormSubmit khi API phản hồi 200', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: 'true', message: 'Email đã được gửi thành công' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendFeedbackViaFormSubmit(sampleFeedback);
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://formsubmit.co/ajax/${TARGET_EMAIL}`,
      expect.objectContaining({
        method: 'POST',
      })
    );

    vi.unstubAllGlobals();
  });

  it('xử lý lỗi khi mạng hoặc API gặp sự cố và trả về thông báo an toàn', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendFeedbackViaFormSubmit(sampleFeedback);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Không thể kết nối đến máy chủ gửi email');

    vi.unstubAllGlobals();
  });
});
