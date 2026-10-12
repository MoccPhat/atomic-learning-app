import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Star,
  Send,
  Mail,
  Copy,
  Check,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  HeartHandshake,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  FeedbackData,
  FeedbackType,
  FEEDBACK_TYPE_LABELS,
  TARGET_EMAIL,
  sendFeedbackViaFormSubmit,
  generateMailtoLink,
  generateClipboardReport,
  getDeviceDiagnostics,
} from '../../lib/feedback-service';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [type, setType] = useState<FeedbackType>('review');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState<boolean>(true);
  const [showDiagnosticsPreview, setShowDiagnosticsPreview] = useState<boolean>(false);

  // === HÌNH ẢNH MINH HỌA / ẢNH CHỤP MÀN HÌNH ===
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return '😡 Rất tệ / Gặp nhiều sự cố';
      case 2:
        return '🙁 Chưa hài lòng';
      case 3:
        return '😐 Bình thường / Đủ dùng';
      case 4:
        return '🙂 Hài lòng & Ổn định';
      case 5:
      default:
        return '🤩 Rất tuyệt vời & Hữu ích!';
    }
  };

  const handleSelectFile = (file: File) => {
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('Chỉ chấp nhận tệp hình ảnh (PNG, JPG, JPEG, WEBP, GIF)');
      return;
    }
    // Giới hạn 5MB để gửi FormSubmit mượt mà
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setImageError(`Dung lượng ảnh vượt quá 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng chọn ảnh nhỏ hơn.`);
      return;
    }
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Hỗ trợ dán ảnh trực tiếp từ Clipboard (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleSelectFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Dọn dẹp preview URL
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  if (!isOpen) return null;

  const currentDiagnostics = getDeviceDiagnostics();

  const currentFeedbackData: FeedbackData = {
    type,
    rating,
    userName: userName.trim() || undefined,
    userEmail: userEmail.trim() || undefined,
    title: title.trim() || `${FEEDBACK_TYPE_LABELS[type].label} - ${rating} sao`,
    description: description.trim(),
    includeDiagnostics,
    imageFile,
  };

  // Xử lý gửi trực tiếp qua FormSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng nhập nội dung mô tả lỗi hoặc ý kiến đóng góp của bạn.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await sendFeedbackViaFormSubmit(currentFeedbackData);
    setIsSubmitting(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: 'Cảm ơn bạn! Ý kiến đánh giá đã được gửi trực tiếp đến hộp thư của tác giả (phat7971@gmail.com).',
      });
      if (onSuccessToast) {
        onSuccessToast('Đã gửi phản hồi thành công đến tác giả! Cảm ơn bạn 🎉');
      }
      setTimeout(() => {
        onClose();
      }, 2200);
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message,
      });
    }
  };

  // Mở ứng dụng Email
  const handleOpenMailto = () => {
    if (!description.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng nhập nội dung mô tả trước khi mở ứng dụng Email.',
      });
      return;
    }
    const mailto = generateMailtoLink(currentFeedbackData);
    window.open(mailto, '_blank');
  };

  // Sao chép báo cáo vào Clipboard
  const handleCopyReport = async () => {
    if (!description.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng nhập nội dung mô tả trước khi sao chép.',
      });
      return;
    }
    const reportText = generateClipboardReport(currentFeedbackData);
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Không thể tự động sao chép. Bạn có thể bôi đen văn bản để copy.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in text-left">
      <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>Đánh Giá Trải Nghiệm & Báo Lỗi</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  Tác giả
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gửi trực tiếp đến <strong className="text-slate-700 dark:text-slate-200">{TARGET_EMAIL}</strong> để nâng cấp hệ thống.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Thông báo trạng thái */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* 1. Mức độ đánh giá Sao */}
          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Mức độ hài lòng của bạn
            </label>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((starNum) => {
                const isLit = (hoverRating ?? rating) >= starNum;
                return (
                  <button
                    key={starNum}
                    type="button"
                    onMouseEnter={() => setHoverRating(starNum)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(starNum)}
                    className="p-1 text-2xl transition-transform active:scale-125 hover:scale-115 focus:outline-none"
                    title={`${starNum} sao`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        isLit
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-fade-in">
              {getRatingLabel(hoverRating ?? rating)}
            </p>
          </div>

          {/* 2. Loại phản hồi (Type selector) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Mục đích gửi phản hồi:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['bug', 'feature', 'review', 'question'] as FeedbackType[]).map((t) => {
                const info = FEEDBACK_TYPE_LABELS[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-start gap-1 ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs ring-1 ring-rose-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">{info.icon}</span>
                    <span className="text-xs font-bold leading-tight">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Tiêu đề phản hồi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tiêu đề ngắn gọn:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'bug'
                  ? 'Ví dụ: Lỗi tràn ngang trên điện thoại iPhone...'
                  : type === 'feature'
                  ? 'Ví dụ: Đề xuất thêm chế độ dịch song ngữ...'
                  : 'Ví dụ: Ứng dụng rất tiện lợi cho sinh viên...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* 4. Nội dung mô tả chi tiết */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Nội dung chi tiết <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal">Càng chi tiết càng giúp tác giả sửa lỗi nhanh</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              placeholder={
                type === 'bug'
                  ? 'Mô tả cụ thể: Lỗi xuất hiện ở màn hình nào? Khi bấm vào nút gì? Biểu hiện của lỗi ra sao...'
                  : 'Nhập nội dung chia sẻ, góp ý hoặc trải nghiệm của bạn tại đây...'
              }
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500 transition-colors leading-relaxed"
            />
          </div>

          {/* 5. Tải ảnh minh họa / Ảnh chụp màn hình */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>Hình ảnh minh họa / Ảnh chụp màn hình:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-normal">Tùy chọn • Tối đa 5MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleSelectFile(e.target.files[0]);
                }
              }}
            />

            {imageFile && imagePreviewUrl ? (
              <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-rose-200 dark:border-rose-800 shrink-0 bg-slate-900">
                    <img
                      src={imagePreviewUrl}
                      alt="Ảnh minh họa đính kèm"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {imageFile.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{(imageFile.size / 1024).toFixed(0)} KB</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Sẵn sàng gửi kèm vào email
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shrink-0"
                  title="Xóa ảnh này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleSelectFile(e.dataTransfer.files[0]);
                  }
                }}
                className="group p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/80 hover:border-rose-400 dark:hover:border-rose-500/60 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/70 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 text-slate-400 group-hover:text-rose-500 flex items-center justify-center transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Bấm để chọn ảnh hoặc kéo thả vào đây
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  Hỗ trợ dán ảnh trực tiếp từ bộ nhớ tạm (Ctrl + V) • PNG, JPG, WEBP
                </div>
              </div>
            )}

            {imageError && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{imageError}</span>
              </p>
            )}
          </div>

          {/* 6. Thông tin người gửi (Tùy chọn) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Tên / Biệt danh (Tùy chọn):
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ví dụ: Hoàng Long (hoặc để trống)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Email phản hồi (Tùy chọn):
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Để tác giả có thể trả lời bạn"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* 6. Đính kèm thông số chẩn đoán máy (Hỗ trợ fix bug) */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDiagnostics}
                  onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  Đính kèm thông tin thiết bị tự động
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowDiagnosticsPreview(!showDiagnosticsPreview)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showDiagnosticsPreview ? 'Thu gọn' : 'Xem thông số'}
              </button>
            </div>

            {showDiagnosticsPreview && (
              <div className="p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-900/60 font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-1 animate-fade-in border border-slate-300/40 dark:border-slate-800">
                <div>• Trình duyệt: {currentDiagnostics.userAgent}</div>
                <div>• Độ phân giải màn hình: {currentDiagnostics.screenResolution} (Khung nhìn: {currentDiagnostics.viewportSize})</div>
                <div>• Chế độ PWA: {currentDiagnostics.isPWA ? 'Đang chạy dạng PWA độc lập' : 'Trình duyệt Web'}</div>
                <div>• Ngôn ngữ: {currentDiagnostics.language}</div>
              </div>
            )}
          </div>

          {/* Các nút hành động */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                title="Sao chép nội dung báo cáo để gửi qua Zalo hoặc Telegram"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép Zalo'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenMailto}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                title="Mở ứng dụng Email mặc định của máy để gửi"
              >
                <Mail className="w-3.5 h-3.5 text-sky-500" />
                <span>Mở Email</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black text-white shadow-lg transition-all active:scale-95 ${
                isSubmitting || !description.trim()
                  ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 shadow-rose-500/25 cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi đến tác giả...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Đánh Giá Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
