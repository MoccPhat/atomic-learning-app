/**
 * Dịch vụ Quản lý & Gửi Phản hồi, Đánh giá và Báo lỗi
 * Hỗ trợ gửi tự động qua FormSubmit về phat7971@gmail.com,
 * mở ứng dụng Email (mailto), hoặc sao chép chẩn đoán máy để gửi qua Zalo/Telegram.
 */

export type FeedbackType = 'bug' | 'feature' | 'review' | 'question';

export interface FeedbackData {
  type: FeedbackType;
  rating: number; // 1 đến 5 sao
  userName?: string;
  userEmail?: string;
  title: string;
  description: string;
  includeDiagnostics: boolean;
}

export interface DeviceDiagnostics {
  userAgent: string;
  screenResolution: string;
  viewportSize: string;
  language: string;
  isPWA: boolean;
  online: boolean;
  timestamp: string;
}

export const TARGET_EMAIL = 'phat7971@gmail.com';

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, { label: string; icon: string; desc: string }> = {
  bug: {
    label: 'Báo lỗi hệ thống',
    icon: '🐛',
    desc: 'Báo cáo sự cố hiển thị, crash hoặc tính năng hoạt động không đúng',
  },
  feature: {
    label: 'Đề xuất tính năng mới',
    icon: '💡',
    desc: 'Ý tưởng hoặc tính năng bạn muốn có trong phiên bản kế tiếp',
  },
  review: {
    label: 'Đánh giá & Khen ngợi',
    icon: '⭐',
    desc: 'Cảm nhận và mức độ hài lòng của bạn khi sử dụng ứng dụng',
  },
  question: {
    label: 'Thắc mắc & Hỗ trợ',
    icon: '❓',
    desc: 'Câu hỏi về cách sử dụng hoặc cần hướng dẫn chi tiết',
  },
};

/**
 * Thu thập thông số kỹ thuật của thiết bị để phục vụ tái hiện lỗi
 */
export function getDeviceDiagnostics(): DeviceDiagnostics {
  const isPWA = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    screenResolution: typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height} (dpr: ${window.devicePixelRatio || 1})`
      : 'Unknown',
    viewportSize: typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight}`
      : 'Unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'vi',
    isPWA,
    online: typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
    timestamp: new Date().toLocaleString('vi-VN'),
  };
}

/**
 * Gửi phản hồi tự động về email qua dịch vụ FormSubmit (Miễn phí, không cần server riêng)
 */
export async function sendFeedbackViaFormSubmit(
  feedback: FeedbackData,
  targetEmail: string = TARGET_EMAIL
): Promise<{ success: boolean; message: string }> {
  const diagnostics = feedback.includeDiagnostics ? getDeviceDiagnostics() : null;
  const typeInfo = FEEDBACK_TYPE_LABELS[feedback.type] || { label: feedback.type, icon: '📝' };

  const payload = {
    name: feedback.userName?.trim() || 'Người dùng ẩn danh',
    email: feedback.userEmail?.trim() || 'no-reply@autolearning.pwa',
    _subject: `[Auto Learning] ${typeInfo.icon} ${typeInfo.label}: ${feedback.title.trim()} (${feedback.rating} sao)`,
    Loại_Phản_Hồi: `${typeInfo.icon} ${typeInfo.label}`,
    Đánh_Giá: `${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5 sao)`,
    Tiêu_Đề: feedback.title.trim(),
    Nội_Dung_Chi_Tiết: feedback.description.trim(),
    Thông_Tin_Thiết_Bị: diagnostics ? JSON.stringify(diagnostics, null, 2) : 'Người dùng không đính kèm',
    _template: 'table',
    _captcha: 'false',
  };

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Mã lỗi HTTP: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      message: data.message || 'Cảm ơn bạn! Đánh giá đã được gửi trực tiếp đến tác giả.',
    };
  } catch (error: any) {
    console.warn('Lỗi khi gửi qua FormSubmit:', error);
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ gửi email. Bạn có thể chọn gửi qua ứng dụng Email hoặc sao chép nội dung.',
    };
  }
}

/**
 * Tạo đường dẫn mailto: để người dùng mở ứng dụng Email có sẵn trên máy
 */
export function generateMailtoLink(feedback: FeedbackData, targetEmail: string = TARGET_EMAIL): string {
  const typeInfo = FEEDBACK_TYPE_LABELS[feedback.type] || { label: feedback.type, icon: '📝' };
  const diagnostics = feedback.includeDiagnostics ? getDeviceDiagnostics() : null;

  const subject = `[Auto Learning] ${typeInfo.icon} ${typeInfo.label}: ${feedback.title}`;

  let body = `Chào tác giả,\n\n`;
  body += `Tôi gửi phản hồi về ứng dụng Auto Learning:\n`;
  body += `- Đánh giá: ${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5 sao)\n`;
  body += `- Phân loại: ${typeInfo.label}\n`;
  body += `- Người gửi: ${feedback.userName || 'Ẩn danh'}\n\n`;
  body += `Nội dung chi tiết:\n${feedback.description}\n\n`;

  if (diagnostics) {
    body += `---\n`;
    body += `Thông tin thiết bị chẩn đoán:\n`;
    body += `- Trình duyệt: ${diagnostics.userAgent}\n`;
    body += `- Màn hình: ${diagnostics.screenResolution} (Khung nhìn: ${diagnostics.viewportSize})\n`;
    body += `- Chế độ PWA: ${diagnostics.isPWA ? 'Đang mở dưới dạng App độc lập' : 'Trình duyệt Web'}\n`;
    body += `- Thời điểm: ${diagnostics.timestamp}\n`;
  }

  return `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Tạo văn bản báo cáo hoàn chỉnh để người dùng dễ dàng copy gửi qua Zalo/Telegram
 */
export function generateClipboardReport(feedback: FeedbackData): string {
  const typeInfo = FEEDBACK_TYPE_LABELS[feedback.type] || { label: feedback.type, icon: '📝' };
  const diagnostics = feedback.includeDiagnostics ? getDeviceDiagnostics() : null;

  let report = `📌 [AUTO LEARNING FEEDBACK]\n`;
  report += `• Tiêu đề: ${feedback.title}\n`;
  report += `• Đánh giá: ${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5 sao)\n`;
  report += `• Phân loại: ${typeInfo.icon} ${typeInfo.label}\n`;
  report += `• Người gửi: ${feedback.userName || 'Ẩn danh'}\n`;
  report += `• Chi tiết:\n${feedback.description}\n`;

  if (diagnostics) {
    report += `\n🔧 [THIẾT BỊ]\n`;
    report += `• OS/Trình duyệt: ${diagnostics.userAgent}\n`;
    report += `• Độ phân giải: ${diagnostics.screenResolution}\n`;
    report += `• Thời điểm: ${diagnostics.timestamp}\n`;
  }

  return report;
}
