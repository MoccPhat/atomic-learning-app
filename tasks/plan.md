# Implementation Plan: Atomic Learning App (PWA)

## Overview
Xây dựng ứng dụng học tập cá nhân PWA (Progressive Web App) tối giản, siêu nhẹ, chạy mượt mà trên PC và Điện thoại. Ứng dụng hỗ trợ cả 4 nội dung (Lập trình, Ngoại ngữ, Sách, Thi cử) thông qua chu trình: Thu thập nhanh -> Nguyên tử hóa kiến thức -> Ôn tập ngắt quãng (FSRS/SM-2) -> Duy trì Streak mỗi ngày.

---

## Architecture Decisions
1. **Frontend Architecture**: Vite + React 18/19 + TypeScript + Tailwind CSS. Lựa chọn này đảm bảo bundle nhẹ (< 150KB gzip), mở tức thì trên trình duyệt mobile, không phụ thuộc server nặng nề.
2. **Storage Strategy**: Local-First lưu trữ an toàn trong `localStorage` / `IndexedDB`, có tính năng One-Click Backup/Restore (JSON) để người dùng tự do chuyển dữ liệu qua lại giữa PC và Điện thoại mà không cần thiết lập cloud phức tạp ban đầu.
3. **PWA Integration**: Cung cấp `manifest.json` và Service Worker để cài đặt trực tiếp lên màn hình chính (Add to Home Screen) trên cả iOS Safari và Android Chrome.
4. **SRS Engine**: Thuật toán lặp lại ngắt quãng SM-2 tiêu chuẩn hóa (tính toán `interval`, `repetitions`, `easeFactor`, `dueDate`), viết thành pure TypeScript module độc lập với UI để đảm bảo kiểm thử tự động 100%.

---

## Task List Summary

### Phase 1: Foundation
- [ ] Task 1: Khởi tạo cấu trúc dự án Vite + React + TypeScript + Tailwind CSS + PWA Manifest
- [ ] Task 2: Xây dựng Module SRS Scheduling Engine (`srs-engine.ts`) & Bộ Unit Test
- [ ] Task 3: Xây dựng Local Storage Adapter & Dữ liệu mẫu (Seed Data) cho 4 danh mục

### Checkpoint 1: Foundation
- [ ] SRS Unit Test vượt qua 100%
- [ ] Build dự án thành công không lỗi type

### Phase 2: Core Vertical Slices
- [ ] Task 4: Giao diện Quick Capture (Thêm thẻ nhanh trong 3 giây trên Mobile & PC)
- [ ] Task 5: Trình ôn tập lật thẻ Spaced Repetition (Active Recall Player với phím tắt & cử chỉ vuốt)
- [ ] Task 6: Tích hợp Syntax Highlighting cho Code Snippet và Công thức Toán KaTeX

### Checkpoint 2: Core Review Flow
- [ ] Luồng tạo thẻ -> Đưa vào hàng đợi -> Lật thẻ ôn tập -> Cập nhật ngày ôn tiếp theo hoạt động trơn tru

### Phase 3: Dashboard, Streak & PWA Polish
- [ ] Task 7: Dashboard trang chủ (Thống kê số thẻ cần ôn hôm nay, Daily Streak, Lọc theo lĩnh vực)
- [ ] Task 8: Tính năng Sao lưu & Phục hồi dữ liệu (Export / Import JSON) và kích hoạt PWA Offline

### Checkpoint 3: Complete MVP
- [ ] Ứng dụng hiển thị hoàn hảo ở độ phân giải 375px (Mobile) và 1440px (Desktop)
- [ ] Cho phép cài đặt ứng dụng lên màn hình chính (PWA Ready)
- [ ] Lưu trữ bền vững dữ liệu khi tắt trình duyệt

---

## Risks and Mitigations
| Rủi ro | Mức độ | Biện pháp giảm thiểu |
| :--- | :--- | :--- |
| Trình duyệt Safari trên iOS xóa cache sau thời gian dài không dùng | Trung bình | Tích hợp nút Export JSON 1-click định kỳ và cơ chế cảnh báo sao lưu |
| Code block hiển thị bị vỡ trên màn hình điện thoại nhỏ | Thấp | Cấu hình `overflow-x-auto`, phông monospace co giãn theo viewport |
| Người dùng bị nản nếu số thẻ dồn ứ quá nhiều (Review Backlog) | Trung bình | Cơ chế giới hạn số thẻ tối đa ôn mỗi ngày (Max 20-30 thẻ/phiên) |
