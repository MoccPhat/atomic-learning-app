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
  imageFile?: File | null;
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
export const FORMSUBMIT_TOKEN = 'edc7294158184bd78f198a1de7db4d8f';

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
 * Gửi phản hồi tự động về email qua dịch vụ FormSubmit (Hỗ trợ kèm tệp hình ảnh minh họa)
 */
export async function sendFeedbackViaFormSubmit(
  feedback: FeedbackData,
  targetEndpoint: string = FORMSUBMIT_TOKEN || TARGET_EMAIL
): Promise<{ success: boolean; message: string }> {
  const diagnostics = feedback.includeDiagnostics ? getDeviceDiagnostics() : null;
  const typeInfo = FEEDBACK_TYPE_LABELS[feedback.type] || { label: feedback.type, icon: '📝' };

  const formData = new FormData();
  formData.append('name', feedback.userName?.trim() || 'Người dùng ẩn danh');
  formData.append('email', feedback.userEmail?.trim() || 'no-reply@autolearning.pwa');
  formData.append('_subject', `[Auto Learning] ${typeInfo.icon} ${typeInfo.label}: ${feedback.title.trim()} (${feedback.rating} sao)`);
  formData.append('Loại_Phản_Hồi', `${typeInfo.icon} ${typeInfo.label}`);
  formData.append('Đánh_Giá', `${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5 sao)`);
  formData.append('Tiêu_Đề', feedback.title.trim());
  formData.append('Nội_Dung_Chi_Tiết', feedback.description.trim());
  formData.append('Thông_Tin_Thiết_Bị', diagnostics ? JSON.stringify(diagnostics, null, 2) : 'Người dùng không đính kèm');
  formData.append('_template', 'table');
  formData.append('_captcha', 'false');

  if (feedback.imageFile) {
    formData.append('attachment', feedback.imageFile);
    formData.append('Tên_Hình_Ảnh', `${feedback.imageFile.name} (${(feedback.imageFile.size / 1024).toFixed(1)} KB)`);
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${targetEndpoint}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Mã lỗi HTTP: ${res.status}`);
    }

    const data = await res.json();
    if (data.success === 'false' || data.success === false) {
      if (typeof data.message === 'string' && data.message.includes('Activation')) {
        return {
          success: true,
          message: 'Hệ thống đã gửi liên kết kích hoạt đến email tác giả. Sau khi bấm kích hoạt trong email, hệ thống sẽ tự động nhận mọi phản hồi!',
        };
      }
      return {
        success: false,
        message: data.message || 'Không thể gửi phản hồi. Vui lòng thử lại sau.',
      };
    }

    return {
      success: true,
      message: data.message || 'Cảm ơn bạn! Đánh giá và hình ảnh đã được gửi trực tiếp đến tác giả.',
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

  if (feedback.imageFile) {
    body += `\n* Lưu ý: Bạn đã chọn tệp ảnh "${feedback.imageFile.name}". Vui lòng đính kèm tệp này vào email trước khi bấm Gửi.\n`;
  }

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

  if (feedback.imageFile) {
    report += `\n📷 [ẢNH ĐÍNH KÈM]: Đã chọn tệp "${feedback.imageFile.name}" (${(feedback.imageFile.size / 1024).toFixed(1)} KB) - Vui lòng gửi kèm file ảnh này khi gửi tin nhắn.\n`;
  }

  if (diagnostics) {
    report += `\n🔧 [THIẾT BỊ]\n`;
    report += `• OS/Trình duyệt: ${diagnostics.userAgent}\n`;
    report += `• Độ phân giải: ${diagnostics.screenResolution}\n`;
    report += `• Thời điểm: ${diagnostics.timestamp}\n`;
  }

  return report;
}
