# Auto Learning - Personal Workspace

Ứng dụng hỗ trợ học tập cá nhân theo mô hình offline-first, tập trung vào kỹ thuật ghi nhớ ngắt quãng (SRS), số hóa tài liệu và luyện thi trắc nghiệm. Ứng dụng chạy trên nền web, tương thích với cả máy tính và thiết bị di động (hỗ trợ PWA).

[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing-22c55e?style=flat&logo=vitest)](https://vitest.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-f59e0b?style=flat&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## Tính Năng Chính

### 1. Flashcard & Lặp lại ngắt quãng (SRS SM-2)
- Thuật toán SuperMemo-2 (SM-2) tự động tính toán chu kỳ ôn tập dựa trên 4 mức đánh giá: Quên, Khó, Nhớ, Dễ.
- Phân loại thẻ theo danh mục: Lập trình, Ngoại ngữ, Sách, Ôn thi.
- Tích hợp Web Speech API hỗ trợ phát âm từ vựng tiếng Anh.
- Phím tắt tạo thẻ nhanh: `Ctrl + K` hoặc `Ctrl + N`.

### 2. Thi trắc nghiệm (Quiz & Mock Exam)
- Chế độ thi thử tính giờ và trực quan hóa kết quả theo từng chuyên đề bằng biểu đồ radar.
- Tùy chọn đảo ngẫu nhiên thứ tự đáp án (A, B, C, D) kèm hỗ trợ phím tắt chọn nhanh.
- Tự động tổng hợp các câu trả lời sai vào danh sách riêng để ôn luyện lại.

### 3. Số hóa tài liệu (OCR)
- Nhận diện văn bản offline trực tiếp trên trình duyệt bằng Tesseract.js (không cần kết nối mạng hay API key).
- Tùy chọn mở rộng qua Gemini Vision đối với tài liệu có chữ viết tay phức tạp.
- Trích xuất văn bản, công thức và đoạn mã nguồn từ hình ảnh.

### 4. Quản lý tài liệu (Study Vault)
- Tổ chức tài liệu theo cây thư mục và môn học.
- Hỗ trợ xem các định dạng: `.pdf`, `.docx`, `.txt`, `.md`, `.csv`, `.json`.
- Công cụ highlight tài liệu và tạo câu hỏi nhanh từ nội dung được chọn.

### 5. Công cụ ghi chép & phương pháp học
- Feynman: Ghi chép và diễn giải lại khái niệm theo cách đơn giản.
- Cornell Notes: Ghi chú theo cấu trúc 3 phần (Gợi ý, Nội dung, Tóm tắt).
- MindMap: Tạo và xuất sơ đồ tư duy dạng vector SVG.
- CheatSheet: Bảng tra cứu nhanh cú pháp, công thức và phím tắt.

### 6. Theo dõi học tập
- Đồng hồ Pomodoro tùy chỉnh khoảng thời gian làm việc/nghỉ ngơi kèm âm thanh thông báo.
- Thống kê thời gian học, chuỗi ngày học liên tục (streak) và biểu đồ hoạt động.
- Hệ thống mốc thành tích ghi nhận tiến độ học tập.

---

## Hướng Dẫn Cài Đặt (PC / Mac)

### Yêu cầu hệ thống:
- Node.js phiên bản 18 trở lên.

### Cài đặt và khởi chạy:
```bash
# 1. Tải mã nguồn về máy
git clone https://github.com/<tai-khoan-cua-ban>/atomic-learning-app.git

# 2. Di chuyển vào thư mục dự án
cd atomic-learning-app

# 3. Cài đặt các gói phụ thuộc
npm install

# 4. Chạy môi trường phát triển
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:5173`

---

## Sử Dụng Trên Điện Thoại (iOS & Android)

Ứng dụng tương thích responsive cho màn hình di động và hỗ trợ chuẩn Progressive Web App (PWA):

### Cách 1: Chạy trong mạng Wi-Fi nội bộ
1. Đảm bảo điện thoại và máy tính kết nối chung một mạng Wi-Fi.
2. Terminal khi chạy `npm run dev` sẽ cung cấp địa chỉ mạng nội bộ, ví dụ:
   ```text
   Local:   http://localhost:5173/
   Network: http://192.168.1.15:5173/
   ```
3. Mở trình duyệt trên điện thoại và nhập địa chỉ mạng nội bộ tương ứng.

### Cách 2: Triển khai lên Vercel / Netlify / Cloudflare Pages
1. Đẩy mã nguồn lên kho lưu trữ GitHub.
2. Kết nối tài khoản GitHub với Vercel hoặc Netlify.
3. Chọn repository và tiến hành Deploy với cấu hình mặc định của Vite.
4. Truy cập qua URL công khai do dịch vụ cung cấp.

### Cài đặt dạng PWA (Standalone) trên màn hình chính:
- **iOS (Safari):** Mở liên kết trên Safari > chọn biểu tượng **Chia sẻ** (Share) > chọn **Thêm vào MH chính** (Add to Home Screen).
- **Android (Chrome):** Mở liên kết trên Chrome > chọn menu **3 chấm** > chọn **Cài đặt ứng dụng** hoặc **Thêm vào màn hình chính**.

---

## Kiểm Thử & Đóng Gói

```bash
# Chạy bộ kiểm thử tự động với Vitest
npm test

# Kiểm tra kiểu dữ liệu TypeScript và build bản production
npm run build

# Xem trước bản build production trên máy local
npm run preview
```

---

## Quản Lý Dữ Liệu & Quyền Riêng Tư

- **Offline-First:** Toàn bộ thẻ ghi nhớ, tài liệu, ghi chú và lịch sử học tập được lưu cục bộ trên trình duyệt qua LocalStorage và IndexedDB.
- **Không thu thập dữ liệu:** Ứng dụng không sử dụng máy chủ trung gian để lưu trữ dữ liệu cá nhân của người dùng.
- **Sao lưu dữ liệu:** Trong phần Cài đặt có tính năng xuất (export) và nhập (import) toàn bộ dữ liệu dưới dạng file JSON để sao lưu hoặc chuyển đổi thiết bị.

---

## Giấy Phép

Phát hành theo giấy phép [MIT License](LICENSE).
