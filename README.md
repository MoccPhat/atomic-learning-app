# ⚛️ Auto Learning - Intelligent Personal Workspace

> **Hệ thống học tập cá nhân nguyên tử thông minh (Atomic Learning App)** — Tối ưu hóa khả năng ghi nhớ dài hạn, số hóa tài liệu học tập và rèn luyện kỹ năng với mô hình **Offline-First**, hoạt động mượt mà trên cả **Máy tính (PC/Mac)** và **Điện thoại di động (iOS/Android)**.

[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-120%20Tests%20Passed-22c55e?style=flat&logo=vitest)](https://vitest.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-f59e0b?style=flat&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## 🌟 Tính Năng Nổi Bật

### 1. 🧠 Flashcard Nguyên Tử & Thuật Toán Lặp Lại Ngắt Quãng (SRS SM-2)
- Áp dụng kỹ thuật **Active Recall** và thuật toán **Spaced Repetition (SuperMemo-2)** điều chỉnh chu kỳ ôn tập thông minh (1 - Quên, 2 - Khó, 3 - Nhớ, 4 - Dễ).
- Phân nhóm 4 trụ cột kiến thức: **Lập trình (Code)**, **Ngoại ngữ (English)**, **Đọc sách (Books)**, và **Ôn thi cử (Exams)**.
- Tích hợp **Web Speech API** phát âm giọng đọc từ vựng tiếng Anh chuẩn bản xứ.
- Tạo thẻ siêu tốc (**Quick Capture**) trong 3 giây với phím tắt `Ctrl + K` hoặc `Ctrl + N`.

### 2. 📝 Luyện Thi Trắc Nghiệm Thông Minh (Quiz Master & Mock Exam)
- Phòng thi mô phỏng thực tế với đồng hồ đếm ngược, phân tích kết quả qua biểu đồ đa chiều **Radar Chart (SVG)**.
- **Tính năng Đảo đáp án ngẫu nhiên (Shuffle Choices):** Xáo trộn linh hoạt các phương án A, B, C, D kèm đồng bộ phím tắt bàn phím và nhấp chuột, triệt tiêu thói quen học vẹt.
- **Sổ tay lỗi sai thông minh (Mistake Notebook):** Tự động thu thập các câu trả lời sai để luyện tập phục thù.

### 3. 📷 Số Hóa Tài Liệu Học Tập (Scanner Machine Learning OCR)
- **Mặc định Machine Learning Offline (Tesseract.js OCR):** Nhận diện chữ viết và văn bản trực tiếp trên trình duyệt mà không cần kết nối mạng hay khóa API.
- Tùy chọn nâng cao **Cloud AI (Gemini Vision)** cho bài toán chữ viết tay phức tạp.
- Tự động chuẩn hóa bố cục, trích xuất công thức toán học và mã nguồn.

### 4. 🗂️ Cây Lưu Trữ Tài Liệu Đa Cấp (Study Vault)
- Quản lý tài liệu theo nhóm ngành học, môn học và phân loại định dạng tệp thông minh.
- Đọc và tương tác với các định dạng phổ biến: `.pdf`, `.docx`, `.txt`, `.md`, `.csv`, `.json`.
- Tích hợp công cụ **Highlight bút nhớ dòng** với nhiều màu sắc và trình tạo câu hỏi tức thì từ văn bản.

### 5. 💡 Các Phương Pháp Học Tập Đỉnh Cao
- **Feynman Studio:** Giải thích các khái niệm phức tạp bằng ngôn từ đơn giản của đứa trẻ 10 tuổi.
- **Cornell Notes Studio:** Ghi chép bài giảng theo cấu trúc 3 phần chuẩn (Cues, Notes, Summary).
- **MindMap Studio:** Thiết kế và xuất sơ đồ tư duy vector SVG tương tác trực quan.
- **CheatSheet Vault:** Bộ thẻ tra cứu nhanh cú pháp, công thức và lệnh tắt.

### 6. ⏱️ Tập Trung & Game Hóa Thói Quen (Gamification)
- **Đồng hồ Pomodoro:** Tùy biến chu kỳ tập trung 25/5/15 phút với âm thanh báo hiệu.
- **Focus Garden & Focus Pet:** Trồng cây xanh và nuôi thú cưng tiến hóa theo thời gian học tập thực tế.
- **Study Heatmap & Streak:** Bản đồ nhiệt đóng góp kiến thức theo phong cách GitHub kèm hệ số chuỗi ngày học liên tục.
- **Hệ thống Huy hiệu Thành tích (Achievements):** Mở khóa danh hiệu và điểm thưởng danh dự.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Trên Máy Tính (PC / Mac)

### Yêu Cầu Hệ Thống:
- Đã cài đặt [Node.js](https://nodejs.org/) (khuyến nghị phiên bản 18 LTS trở lên).

### Các Bước Thực Hiện:
```bash
# 1. Tải mã nguồn về máy
git clone https://github.com/<tai-khoan-cua-ban>/atomic-learning-app.git

# 2. Di chuyển vào thư mục dự án
cd atomic-learning-app

# 3. Cài đặt các thư viện phụ thuộc
npm install

# 4. Khởi chạy môi trường phát triển (Dev Server)
npm run dev
```

Mở trình duyệt và truy cập vào đường dẫn:
👉 **`http://localhost:5173`**

---

## 📱 Hướng Dẫn Sử Dụng Trên Điện Thoại (iOS & Android)

Ứng dụng được thiết kế tương thích hoàn hảo cho điện thoại di động (Responsive 100%) và hỗ trợ chuẩn **Progressive Web App (PWA)**:

### Cách 1: Sử dụng trong mạng nội bộ WiFi (Dễ nhất khi đang chạy trên PC)
1. Đảm bảo điện thoại và máy tính kết nối **chung một mạng WiFi**.
2. Khi chạy lệnh `npm run dev` trên máy tính, terminal sẽ thông báo địa chỉ mạng nội bộ, ví dụ:
   ```text
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.15:5173/
   ```
3. Mở trình duyệt trên điện thoại và gõ địa chỉ `http://192.168.x.x:5173/`.

### Cách 2: Triển khai lên Vercel / Netlify / Cloudflare Pages (Khuyên dùng để dùng mọi lúc mọi nơi)
Bạn có thể đưa trang web lên dịch vụ hosting miễn phí chỉ trong 2 phút:
1. Đẩy mã nguồn lên GitHub repository cá nhân.
2. Đăng nhập [Vercel.com](https://vercel.com) hoặc [Netlify.com](https://netlify.com) bằng tài khoản GitHub.
3. Chọn repo `atomic-learning-app` và nhấn **Deploy** (hệ thống sẽ tự nhận diện Vite và build).
4. Bạn sẽ có ngay một đường link công khai dạng `https://ten-ung-dung.vercel.app` để truy cập từ bất kỳ điện thoại hay thiết bị nào!

### 📲 Cài đặt ứng dụng lên Màn hình chính điện thoại (PWA Standalone App):
- **Trên iPhone / iPad (Safari):**
  1. Mở link ứng dụng trên trình duyệt **Safari**.
  2. Bấm vào nút **Chia sẻ** (biểu tượng hình vuông có mũi tên trỏ lên ở thanh dưới).
  3. Cuộn xuống và chọn **"Thêm vào MH chính" (Add to Home Screen)**.
- **Trên Android (Chrome / Brave / Edge):**
  1. Mở link ứng dụng trên trình duyệt **Chrome**.
  2. Bấm vào menu **3 chấm** ở góc trên bên phải.
  3. Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.

> 💡 *Sau khi thêm, bạn có thể mở ứng dụng như một app thông thường không có thanh địa chỉ trình duyệt, hoạt động ngoại tuyến (Offline) ngay cả khi mất mạng!*

---

## 🧪 Kiểm Thử & Đóng Gói (Testing & Build)

Dự án áp dụng quy chuẩn kỹ thuật nghiêm ngặt, tuân thủ nguyên tắc Clean Code và kiểm thử tự động toàn diện:

```bash
# Chạy bộ kiểm thử tự động Vitest (120 test cases)
npm test

# Kiểm tra cú pháp TypeScript và đóng gói bản phát hành Production
npm run build

# Chạy thử bản build production trên máy
npm run preview
```

---

## 🔒 Cam Kết Bảo Mật & Quyền Riêng Tư (Privacy First)

- **100% Offline-First:** Toàn bộ thẻ nhớ, tài liệu, kết quả thi cử, ghi chú và lịch sử đều được lưu trữ an toàn trong trình duyệt của bạn qua **LocalStorage** và **IndexedDB**.
- **Không thu thập dữ liệu cá nhân:** Không có máy chủ trung gian theo dõi hay lưu giữ kiến thức của bạn.
- **Sao lưu & Phục hồi dễ dàng:** Tính năng Cài đặt hỗ trợ xuất/nhập toàn bộ dữ liệu ra tệp JSON bất kỳ lúc nào để chuyển đổi sang máy khác.

---

## 📄 Giấy Phép & Bản Quyền

Dự án phát triển phục vụ mục đích học tập cá nhân và cộng đồng. Được phát hành theo giấy phép [MIT License](LICENSE).
