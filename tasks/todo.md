# Task List: Atomic Learning App

## Phase 1: Foundation

- [x] **Task 1: Khởi tạo cấu trúc dự án Vite + React + Tailwind + PWA Manifest**
  - **Mô tả:** Khởi tạo thư mục dự án với Vite, React, TypeScript, cấu hình Tailwind CSS, Lucide icons và file `manifest.json` chuẩn PWA.
  - **Acceptance:**
    - Cấu trúc thư mục đúng chuẩn theo SPEC.
    - Dự án build thành công và chạy được dev server.
  - **Verify:** `npm run build` không lỗi.
  - **Files:** `package.json`, `vite.config.ts`, `tailwind.config.js`, `public/manifest.json`, `index.html`.

- [x] **Task 2: Xây dựng Module SRS Scheduling Engine (`srs-engine.ts`) & Unit Test**
  - **Mô tả:** Viết hàm thuần túy tính toán chu kỳ lặp lại ngắt quãng (SM-2): tính `interval`, `repetitions`, `easeFactor`, `dueDate` dựa trên điểm đánh giá (1: Again, 2: Hard, 3: Good, 4: Easy).
  - **Acceptance:**
    - Hàm xử lý chính xác khi user chọn "Again" (trả về interval = 1).
    - Hàm tăng interval theo easeFactor khi user chọn "Good" hoặc "Easy".
    - Viết unit test kiểm thử các trường hợp biên.
  - **Verify:** Chạy test suite `srs-engine.test.ts` pass 100% (9/9 tests passed).
  - **Files:** `src/lib/types.ts`, `src/lib/srs-engine.ts`, `src/tests/srs-engine.test.ts`.

- [x] **Task 3: Xây dựng Local Storage Adapter & Dữ liệu mẫu (Seed Data)**
  - **Mô tả:** Xây dựng adapter đọc/ghi dữ liệu vào `localStorage` với dữ liệu ban đầu gồm các thẻ mẫu thuộc cả 4 lĩnh vực (Python Snippet, Từ vựng tiếng Anh, Trích dẫn sách Sapiens, Câu hỏi thi AWS/GCP).
  - **Acceptance:**
    - Tự động nạp dữ liệu mẫu nếu chưa có dữ liệu.
    - Cung cấp các hàm CRUD thẻ và ghi nhận nhật ký ôn tập (Review Log).
  - **Verify:** Đọc ghi thử dữ liệu và kiểm tra persistence khi reload trang.
  - **Files:** `src/lib/storage.ts`, `src/lib/seed-data.ts`.

---

## Checkpoint 1: Foundation
- [x] Module SRS vượt qua mọi bài unit test (9/9 passed).
- [x] Storage adapter nạp đầy đủ dữ liệu mẫu 4 lĩnh vực.
- [x] Dự án build sạch sẽ không lỗi TypeScript.

---

## Phase 2: Core Vertical Slices

- [x] **Task 4: Giao diện Quick Capture (Thêm thẻ nhanh trong 3 giây)**
  - **Mô tả:** Tạo modal / form nhập nhanh thẻ kiến thức mới: chọn loại (Code / English / Book / Exam), nhập mặt trước (Câu hỏi / Từ vựng) và mặt sau (Đáp án / Giải thích / Code).
  - **Acceptance:**
    - Thao tác nhanh với phím tắt trên PC và nút bấm nổi (Floating FAB) trên điện thoại.
    - Thẻ mới tạo lập tức được gán `dueDate` là hôm nay và lưu vào storage.
  - **Verify:** Nhập thử 1 thẻ mới và thấy thẻ xuất hiện ngay trong danh sách.
  - **Files:** `src/components/QuickCaptureModal.tsx`.

- [x] **Task 5: Trình ôn tập lật thẻ Spaced Repetition (Active Recall Player)**
  - **Mô tả:** Màn hình ôn tập thẻ đến hạn (Due Cards). Cho phép xem mặt trước -> ấn lật thẻ xem mặt sau -> bấm 4 mức đánh giá (Quên, Khó, Nhớ, Dễ) hoặc dùng phím 1-4.
  - **Acceptance:**
    - Hiệu ứng lật thẻ mượt mà, hỗ trợ chạm vuốt trên mobile.
    - Sau khi đánh giá, cập nhật chu kỳ SRS của thẻ và chuyển ngay sang thẻ kế tiếp.
    - Hiển thị màn hình chúc mừng khi hoàn thành tất cả thẻ cần ôn trong ngày.
  - **Verify:** Thử ôn hết các thẻ mẫu, kiểm tra ngày ôn tiếp theo được cập nhật chính xác.
  - **Files:** `src/components/ReviewPlayer.tsx`.

- [x] **Task 6: Hiển thị Code Snippet & Công thức Toán đẹp mắt**
  - **Mô tả:** Tích hợp syntax highlighting cho thẻ thuộc loại Code (highlight từ khóa, số dòng, nút copy code) và hỗ trợ hiển thị Markdown cơ bản.
  - **Acceptance:**
    - Code snippet hiển thị có màu cú pháp, font monospace, cuộn ngang mượt mà không vỡ khung mobile.
  - **Verify:** Mở một thẻ code Python / TypeScript và kiểm tra định dạng.
  - **Files:** `src/components/CodeCardView.tsx`.

---

## Checkpoint 2: Core Review Flow
- [x] Quy trình khép kín: Tạo thẻ -> Đưa vào danh sách ôn tập -> Lật thẻ trả lời -> Chấm điểm cập nhật lịch ôn tập.

---

## Phase 3: Dashboard, Streak & PWA Polish

- [x] **Task 7: Dashboard trang chủ & Daily Streak Tracker**
  - **Mô tả:** Giao diện trang chủ hiển thị: Nút "Bắt đầu ôn tập ngay" kèm số thẻ đến hạn hôm nay, bộ lọc theo 4 chủ đề (Code, English, Book, Exam), và số ngày Streak học liên tục.
  - **Acceptance:**
    - Số đếm streak tự động tăng khi hoàn thành tối thiểu 1 phiên ôn tập trong ngày.
    - Lọc danh sách thẻ theo chủ đề mượt mà.
  - **Verify:** Kiểm tra giao diện trên cả mobile (375px) và desktop (1440px).
  - **Files:** `src/components/Dashboard.tsx`, `src/App.tsx`.

- [x] **Task 8: Tính năng Sao lưu / Phục hồi dữ liệu (Export/Import JSON) & PWA Service Worker**
  - **Mô tả:** Bổ sung tính năng sao lưu dữ liệu ra file JSON tải về máy và nhập lại từ file JSON. Cấu hình Service Worker để cache offline.
  - **Acceptance:**
    - Xuất file `.json` và nhập lại thành công không mất dữ liệu.
    - Đăng ký Service Worker thành công, hoạt động được khi ngắt kết nối mạng.
  - **Verify:** Thử ngắt mạng (offline) và tải lại trang web vẫn chạy bình thường.
  - **Files:** `src/components/SettingsModal.tsx`, `public/sw.js`.

---

## Checkpoint 3: Complete MVP
- [x] Toàn bộ 8 tác vụ hoàn thành.
- [x] Chạy kiểm thử tự động (9 tests passed), build production thành công (dist bundle < 70KB gzip).
- [x] Trải nghiệm hoàn chỉnh trên cả màn hình máy tính và điện thoại.

---

## Phase 4: Cây Lưu Trữ Tài Liệu Học Tập (Tree Storage Vault)

- [x] **Task 9: Data Model, Auto-Extension Grouping & IndexedDB Storage (`tree-types.ts`, `tree-storage.ts`, `tree-seed-data.ts`)**
  - **Mô tả:** Thiết kế cấu trúc cây 4 tầng (Khối ngành/Học kỳ ➔ Môn học ➔ Tuần ➔ Folder đuôi file .docx, .ipynb, .pdf, .py... ➔ File). Lưu trữ file lớn an toàn bằng IndexedDB offline-first, hỗ trợ cả máy tính và điện thoại.
  - **Acceptance:**
    - Type-safe models: `SubjectGroup`, `Subject`, `WeekFolder`, `StoredFile`, `ExtensionGroup`.
    - Auto-cluster file theo đuôi khi thêm vào tuần.
    - Đọc/ghi và xóa file trong IndexedDB kèm fallback LocalStorage.
  - **Files:** `src/lib/tree-types.ts`, `src/lib/tree-storage.ts`, `src/lib/tree-seed-data.ts`.

- [x] **Task 10: Trình xem trước file & Tải file (`FilePreviewModal.tsx`)**
  - **Mô tả:** Cho phép xem trực tiếp nội dung file code, text, markdown, ảnh và render trực quan notebook `.ipynb` ngay trên web/mobile không cần cài thêm Jupyter. Cung cấp nút tải file về máy.
  - **Acceptance:**
    - Tải file về máy mượt mà trên cả PC và điện thoại.
    - Preview mượt mà file `.ipynb`, `.py`, `.txt`, `.md`, `.json`, `.png`/`.jpg`.
  - **Files:** `src/components/tree/FilePreviewModal.tsx`.

- [x] **Task 11: Giao diện Cây Tài Liệu (`TreeExplorer.tsx`)**
  - **Mô tả:** Giao diện quản lý cây thư mục phân tầng, kéo thả upload file vào tuần, tự động gom vào folder đuôi file tương ứng, thanh tìm kiếm file toàn cục, tạo môn học và tuần mới.
  - **Acceptance:**
    - Cây thư mục mở rộng/thu gọn trực quan.
    - Kéo thả file hoặc chọn file nạp vào tuần; file tự nhảy vào đúng folder `.docx`, `.ipynb`...
    - Giao diện chuẩn responsive trên điện thoại (Breadcrumbs / Tabs).
    - Hỗ trợ đầy đủ Dark Mode / Light Mode và 5 tông màu accent.
  - **Files:** `src/components/tree/TreeExplorer.tsx`.

- [x] **Task 12: Tích hợp Sidebar & App State (`Sidebar.tsx`, `App.tsx`)**
  - **Mô tả:** Thêm mục "Cây tài liệu" vào Sidebar với icon cây thư mục và số lượng file, liên kết tab trong `App.tsx`.
  - **Acceptance:**
    - Chuyển tab giữa Flashcards, Quiz và Cây tài liệu mượt mà.
  - **Files:** `src/components/Sidebar.tsx`, `src/App.tsx`.

- [x] **Task 13: Kiểm thử & Build Verification**
  - **Mô tả:** Viết unit test cho logic nhóm đuôi file và kiểm tra `tsc --noEmit`, `vite build`.
  - **Files:** `src/tests/tree-grouping.test.ts`.

---

## Checkpoint 4: Complete Tree Storage Vault
- [x] Hoàn thành 100% các tính năng lưu trữ phân cấp cây, tự động gom folder theo đuôi file .docx, .ipynb, .pdf, .py.
- [x] Hỗ trợ mở và xem trực tiếp trên cả máy tính và điện thoại thông qua IndexedDB offline.
- [x] 13/13 unit tests pass, TypeScript 0 errors, build production hoàn tất.

---

## Phase 5: Lịch Đếm Ngược Deadline & Bản Đồ Nhiệt Học Tập (Heatmap Analytics)

- [x] **Task 14: Data Model & Storage cho Deadline Tasks (`deadline-types.ts`, `deadline-storage.ts`)**
  - **Mô tả:** Thiết kế model DeadlineTask (id, title, subjectId, weekId, dueDate, priority, completed). Hàm tính toán thời gian còn lại (time remaining), đếm ngược và lưu trữ LocalStorage.
  - **Files:** `src/lib/deadline-types.ts`, `src/lib/deadline-storage.ts`.

- [x] **Task 15: Component Bản Đồ Nhiệt Học Tập (`StudyHeatmap.tsx`)**
  - **Mô tả:** Xây dựng ma trận đóng góp dạng ô vuông giống GitHub (hỗ trợ các mốc 1 tháng, 6 tháng và 12 tháng/365 ngày), 5 cấp độ màu sắc theo số lượng hoạt động, tooltip hiển thị chi tiết ngày, thống kê chuỗi streak và ngày chăm chỉ nhất.
  - **Files:** `src/components/analytics/StudyHeatmap.tsx`.

- [x] **Task 16: Giao diện Quản lý & Đếm Ngược Deadline (`DeadlineManager.tsx`, `AddDeadlineModal.tsx`)**
  - **Mô tả:** Thẻ đếm ngược thời gian thực (Còn X ngày Y giờ, Quá hạn đỏ), badge mức độ ưu tiên, checkbox hoàn thành, modal thêm deadline liên kết môn học/tuần.
  - **Files:** `src/components/deadlines/DeadlineManager.tsx`, `src/components/deadlines/AddDeadlineModal.tsx`.

- [x] **Task 17: Tích hợp Dashboard & Cây tài liệu môn học (`Dashboard.tsx`, `TreeExplorer.tsx`, `App.tsx`)**
  - **Mô tả:** Đưa Heatmap và danh sách Deadline sắp tới lên Dashboard trang chủ; hiển thị deadline của từng tuần trong Cây tài liệu.
  - **Files:** `src/components/Dashboard.tsx`, `src/components/tree/TreeExplorer.tsx`, `src/App.tsx`.

- [x] **Task 18: Kiểm thử & Build Verification**
  - **Mô tả:** Viết unit test cho logic đếm ngược thời gian và lưu trữ deadline, kiểm tra `tsc --noEmit` và `vite build`.
  - **Files:** `src/tests/deadlines.test.ts`.

---

## Checkpoint 5: Complete Heatmap & Deadlines
- [x] Hoàn thành Heatmap với bộ lọc 1 tháng, 6 tháng, 12 tháng và đếm ngược deadline.
- [x] Toàn bộ test deadlines vượt qua 100%.

---

## Phase 6: Document Scanner AI & Layout Preserver (Số Hóa Tài Liệu)

- [x] **Task 19: Scanner Service & Hybrid Engine (`scanner-service.ts`, `scanner-service.test.ts`)**
  - **Mô tả:** Tích hợp gọi Google Gemini Vision API (2.5/2.0/1.5 Flash) direct client-side với prompt giữ nguyên 100% bố cục, kèm Tesseract.js OCR Offline khi mất mạng.
  - **Files:** `src/lib/scanner-service.ts`, `src/tests/scanner-service.test.ts`.

- [x] **Task 20: Giao diện DocumentScanner & Textarea Bảo Toàn Bố Cục (`DocumentScanner.tsx`)**
  - **Mô tả:** Kéo thả/Paste Ctrl+V/Camera, hiệu ứng laser scan, ô Textarea hiển thị kết quả giữ nguyên thụt đầu dòng, bảng biểu, KaTeX và code block, bộ đếm từ/dòng/ký tự, chuyển đổi Soạn thảo/Xem trước.
  - **Files:** `src/components/scanner/DocumentScanner.tsx`.

- [x] **Task 21: Tích hợp Hệ Sinh Thái Học Tập**
  - **Mô tả:** Nút hành động 1-chạm: Tạo Đề Quiz (QuizMaster), Tạo Thẻ Flashcard (Cards), Lưu vào Vault (TreeExplorer), Sao chép clipboard.
  - **Files:** `src/components/scanner/DocumentScanner.tsx`, `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/Dashboard.tsx`.

- [x] **Task 22: Quản lý Gemini API Key trong SettingsModal & Scanner**
  - **Mô tả:** Modal nhập API key nhanh và tab cấu hình AI Vision trong SettingsModal, lưu an toàn tại máy (`localStorage`).
  - **Files:** `src/components/SettingsModal.tsx`, `src/components/scanner/DocumentScanner.tsx`.

---

## Checkpoint 6: Scanner AI Ready
- [x] Hoàn thành tính năng Quét & Số hóa tài liệu với cả AI Vision và Offline OCR.
- [x] 33/33 unit tests pass, TypeScript 0 errors, build production hoàn tất.

---

## Phase 7: Các Tính Năng Đột Phá Tiếp Theo (Roadmap)

- [x] **Task 23: Audio Hands-Free Review (Ôn tập rảnh tay bằng giọng nói Web Speech API)**
  - **Mô tả:** Chế độ phát âm thanh tự động đọc mặt trước (câu hỏi) -> đếm lùi suy nghĩ (2s/3s/5s/8s) -> tự động lật thẻ đọc mặt sau (đáp án) -> tự chuyển thẻ tiếp theo, kết hợp bộ sinh âm thanh nền Ambient (Brown Noise, Tiếng mưa, Sóng Alpha 10Hz, Sóng Gamma 40Hz) bằng Web Audio API thuần 0-byte offline.
  - **Files:** `src/lib/speech-service.ts`, `src/lib/ambient-audio.ts`, `src/components/ReviewPlayer.tsx`, `src/tests/speech-service.test.ts`.

- [x] **Task 24: Mock Exam Simulator (Phòng thi thử & Radar điểm yếu)**
  - **Mô tả:** Chế độ phòng thi thử áp lực thời gian với bộ đề từ Quiz Master, đồng hồ đếm ngược có cảnh báo đỏ khi sắp hết giờ, xáo trộn câu hỏi và 4 đáp án, ẩn kết quả tức thì (Zen Mode), lưới câu hỏi đánh dấu phân vân (Flagged), chấm điểm thang 10, vẽ biểu đồ Radar điểm yếu SVG 5 chiều năng lực, và 1-click tạo thẻ Flashcard từ các câu sai.
  - **Files:** `src/lib/mock-exam-service.ts`, `src/components/quiz/WeaknessRadarChart.tsx`, `src/components/quiz/MockExamRoom.tsx`, `src/components/quiz/MockExamResultView.tsx`, `src/components/quiz/QuizListView.tsx`, `src/components/quiz/QuizMaster.tsx`, `src/tests/mock-exam.test.ts`.

- [x] **Task 25: Feynman Socratic Coach (Trợ lý phản biện kiến thức AI)**
  - **Mô tả:** Người dùng nhập khái niệm và tự viết lời giải thích bằng ngôn từ bình dị của mình. Hệ thống sử dụng Gemini AI (hoặc bộ phân tích Heuristic Offline) đóng vai Socrates & Richard Feynman để chấm điểm thấu triệt (1-100), bóc trần thuật ngữ sách vở (Jargon Alert), chỉ ra lỗ hổng tư duy, đặt 2 câu hỏi phản biện sâu sắc, gợi ý phép ẩn dụ đời thường và 1-chạm lưu thành Flashcard Spaced Repetition.
  - **Files:** `src/lib/feynman-service.ts`, `src/components/feynman/FeynmanStudio.tsx`, `src/tests/feynman-service.test.ts`, `src/components/Sidebar.tsx`, `src/App.tsx`.

---

## Checkpoint 7: Complete Breakthrough Learning Ecosystem
- [x] 100% 3 tính năng đột phá của Phase 7 đã hoàn thành và tích hợp mượt mà vào ứng dụng.
- [x] Toàn bộ 11 test suites vượt qua (63/63 tests passed).
- [x] TypeScript biên dịch sạch 0 lỗi (`tsc --noEmit`).
- [x] Production build hoàn tất thành công (`vite build` bundle tối ưu).
- [x] Đã kiểm thử thực tế trên trình duyệt Chrome qua DevTools.

