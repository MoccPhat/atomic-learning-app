import { describe, it, expect, vi } from 'vitest';
import {
  getDeviceDiagnostics,
  generateMailtoLink,
  generateClipboardReport,
  sendFeedbackViaFormSubmit,
  TARGET_EMAIL,
  FORMSUBMIT_TOKEN,
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

  it('tạo link mailto có thông báo đính kèm ảnh khi có imageFile', () => {
    const feedbackWithImage: FeedbackData = {
      ...sampleFeedback,
      imageFile: new File(['fake content'], 'screenshot.png', { type: 'image/png' }),
    };
    const mailto = generateMailtoLink(feedbackWithImage);
    expect(mailto).toContain(encodeURIComponent('screenshot.png'));
  });

  it('tạo báo cáo văn bản để sao chép Zalo/Telegram chuẩn định dạng', () => {
    const report = generateClipboardReport(sampleFeedback);
    expect(report).toContain('[AUTO LEARNING FEEDBACK]');
    expect(report).toContain('Lỗi tràn màn hình trên Safari');
    expect(report).toContain('4/5 sao');
    expect(report).toContain('Thử Nghiệm Viên');
    expect(report).toContain('Thanh cuộn ngang xuất hiện khi mở bảng nhiệt.');
  });

  it('tạo báo cáo văn bản có ghi chú ảnh đính kèm khi có imageFile', () => {
    const feedbackWithImage: FeedbackData = {
      ...sampleFeedback,
      imageFile: new File(['fake content'], 'error-sample.png', { type: 'image/png' }),
    };
    const report = generateClipboardReport(feedbackWithImage);
    expect(report).toContain('error-sample.png');
    expect(report).toContain('[ẢNH ĐÍNH KÈM]');
  });

  it('gửi phản hồi thành công qua FormSubmit Token khi API phản hồi 200', async () => {
    let capturedBody: FormData | null = null;
    const mockFetch = vi.fn().mockImplementation((_url, options) => {
      capturedBody = options.body;
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: 'true', message: 'Email đã được gửi thành công' }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendFeedbackViaFormSubmit(sampleFeedback);
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://formsubmit.co/ajax/${FORMSUBMIT_TOKEN}`,
      expect.objectContaining({
        method: 'POST',
      })
    );

    expect(capturedBody).not.toBeNull();
    const body = capturedBody as unknown as FormData;
    expect(body.get('name')).toBe('Thử Nghiệm Viên');
    expect(body.get('email')).toBe('tester@example.com');
    expect(body.get('Tiêu_Đề')).toBe('Lỗi tràn màn hình trên Safari');

    vi.unstubAllGlobals();
  });

  it('đính kèm đúng trường attachment và tên hình ảnh vào FormData khi có tệp ảnh', async () => {
    let capturedBody: FormData | null = null;
    const mockFetch = vi.fn().mockImplementation((_url, options) => {
      capturedBody = options.body;
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: 'true', message: 'Tệp và đánh giá đã được gửi' }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const testFile = new File(['fake-png-binary-data'], 'man-hinh-loi.png', { type: 'image/png' });
    const feedbackWithImage: FeedbackData = {
      ...sampleFeedback,
      imageFile: testFile,
    };

    const result = await sendFeedbackViaFormSubmit(feedbackWithImage);
    expect(result.success).toBe(true);
    expect(capturedBody).not.toBeNull();
    const body = capturedBody as unknown as FormData;
    expect(body.get('attachment')).toBe(testFile);
    expect(body.get('Tên_Hình_Ảnh')).toContain('man-hinh-loi.png');

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
