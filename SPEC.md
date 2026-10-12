# Spec: Atomic Learning App (PWA)

## 1. Objective
Xây dựng ứng dụng học tập cá nhân **Atomic Learning App** chuẩn Progressive Web App (PWA), hoạt động mượt mà trên cả máy tính (Desktop/PC) và điện thoại (Mobile iOS & Android), đồng bộ dữ liệu và giải quyết 4 bài toán:
1. **Lập trình / Kỹ thuật**: Lưu snippet code, tra cứu ghi chú cú pháp, ôn tập khái niệm kiến trúc.
2. **Ngoại ngữ**: Học từ vựng theo ngữ cảnh, flashcard 2 mặt, phát âm bằng Web Speech API.
3. **Đọc sách & Nghiên cứu**: Tổng hợp ý tưởng cô đọng, trích dẫn bài học đắt giá.
4. **Ôn thi chứng chỉ**: Luyện phản xạ câu hỏi trắc nghiệm/tự luận theo chu kỳ lặp lại ngắt quãng (Spaced Repetition).

---

## 2. Tech Stack & Dependencies
- **Core Framework**: Next.js 15+ (App Router) hoặc Vite + React 19 + TypeScript.
- **Styling**: Tailwind CSS, Lucide React (Icons).
- **Code & Math Highlighting**: PrismJS / Shiki (cho code snippet đa ngôn ngữ), KaTeX (cho công thức toán/khoa học).
- **Spaced Repetition Engine**: Thuật toán FSRS rút gọn (Free Spaced Repetition Scheduler) hoặc SM-2 tiêu chuẩn.
- **Data Persistence**: Local-first (IndexedDB qua Dexie.js / LocalStorage) kết hợp adapter sẵn sàng đồng bộ Supabase Cloud.
- **PWA Capabilities**: Service Worker, Web App Manifest, Offline-first caching.

---

## 3. Project Structure
```text
atomic-learning-app/
├── public/
│   ├── manifest.json            # PWA manifest (icon, standalone display)
│   ├── sw.js                    # Service worker offline caching
│   └── icons/                   # App icons (192x192, 512x512)
├── src/
│   ├── app/ (hoặc pages/)
│   │   ├── layout.tsx           # Mobile navigation bar + Desktop sidebar
│   │   ├── page.tsx             # Dashboard: Daily Review CTA + Streak Heatmap
│   │   ├── review/
│   │   │   └── page.tsx         # Mobile-first Flashcard & Quiz player
│   │   ├── notes/
│   │   │   └── page.tsx         # PC-first Markdown Editor & Card Generator
│   │   └── settings/
│   │       └── page.tsx         # Import/Export JSON, Cloud sync settings
│   ├── components/
│   │   ├── ui/                  # Button, Card, Dialog, Badge, Tabs
│   │   ├── review/
│   │   │   ├── flashcard.tsx    # Lật thẻ, swipe action, grading buttons
│   │   │   └── code-card.tsx    # Thẻ code có syntax highlight
│   │   ├── editor/
│   │   │   └── quick-capture.tsx# Popup nhập nhanh trong 3 giây
│   │   └── analytics/
│   │       └── streak-map.tsx   # Bản đồ nhiệt commit học tập kiểu GitHub
│   ├── lib/
│   │   ├── srs-engine.ts        # Thuật toán tính ngày ôn tiếp theo (FSRS / SM-2)
│   │   ├── db.ts                # Local database adapter (IndexedDB)
│   │   └── types.ts             # Định nghĩa Type TypeScript cho Note, Card, ReviewLog
│   └── tests/
│       └── srs-engine.test.ts   # Unit test cho logic thuật toán ôn tập
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── SPEC.md
```

---

## 4. Commands
- **Cài đặt thư viện**: `npm install`
- **Khởi chạy môi trường Dev**: `npm run dev`
- **Build Production**: `npm run build`
- **Chạy Unit Tests**: `npm test`
- **Kiểm tra Lint**: `npm run lint`

---

## 5. Code Style & Quy Chuẩn Kiến Trúc
- **Tách bạch thuật toán cốt lõi (Separation of Concerns)**: Thuật toán Spaced Repetition (`srs-engine.ts`) là Pure Function, không phụ thuộc vào React hay UI, có 100% unit test coverage.
- **Mobile-first UI**: Mọi màn hình phải thiết kế cho khung nhìn điện thoại trước (tối thiểu 375px), sau đó co giãn tự nhiên lên màn hình PC.
- **Example Snippet (Core Data Model)**:
```typescript
export interface Card {
  id: string;
  category: 'code' | 'english' | 'book' | 'exam';
  title: string;
  front: string;          // Câu hỏi, từ vựng, hoặc đoạn code cần giải thích
  back: string;           // Đáp án, nghĩa, giải thích chi tiết
  codeLanguage?: string;  // Ví dụ: 'python', 'typescript'
  tags: string[];
  
  // SRS Metadata
  interval: number;       // Số ngày đến lần ôn tiếp theo
  repetitions: number;    // Số lần đã ôn thành công
  easeFactor: number;     // Hệ số độ khó (mặc định 2.5)
  dueDate: string;        // YYYY-MM-DD
  lastReviewed?: string;
}
```

---

## 6. Testing Strategy
1. **Unit Test (Vitest / Jest)**:
   - Kiểm thử thuật toán `srs-engine.ts`: Khi chọn "Again" (Quên), interval quay về 1 ngày; khi chọn "Easy", interval tăng theo hệ số nhân.
   - Kiểm thử bộ lọc thẻ đến hạn ôn (`getDueCards`).
2. **E2E / Responsive Test**:
   - Kiểm thử luồng tạo thẻ mới -> xuất hiện trong hàng đợi ôn tập -> hoàn thành phiên ôn -> cập nhật Streak.

---

## 7. Boundaries
- **Always do**:
  - Tối ưu chạm vuốt trên mobile (Touch-friendly, nút bấm tối thiểu 44px theo chuẩn WCAG).
  - Tự động lưu dữ liệu vào LocalStorage/IndexedDB để không bị mất khi reload hoặc offline.
  - Hỗ trợ phím tắt trên PC (Space để lật thẻ, phím 1-4 để chấm điểm).
- **Ask first**:
  - Tích hợp thêm dịch vụ trả phí của bên thứ ba (OpenAI API key, Cloud hosting có phí).
  - Thay đổi cấu trúc cơ sở dữ liệu làm mất tương thích dữ liệu cũ.
- **Never do**:
  - Không tải các thư viện UI cồng kềnh không cần thiết.
  - Không bắt buộc người dùng phải đăng nhập mới cho dùng thử (hỗ trợ chế độ Guest / Offline-first ngay lập tức).

---

## 8. Success Criteria (Tiêu chí nghiệm thu)
- [ ] Mở được trên trình duyệt điện thoại và máy tính qua cùng 1 địa chỉ (Responsive hoàn hảo).
- [ ] Có thể cài đặt thành PWA (nút "Thêm vào màn hình chính" trên iOS Safari / Android Chrome).
- [ ] Ghi chép nhanh 1 thẻ kiến thức mới trong vòng < 3 giây.
- [ ] Thực hiện 1 phiên ôn tập 5 thẻ với đầy đủ hiệu ứng lật thẻ và chấm điểm độ khó.
- [ ] Dữ liệu được lưu trữ bền vững, tắt trình duyệt mở lại vẫn giữ nguyên lịch sử và streak.

---

## 9. Open Questions (Câu hỏi mở)
1. Bạn muốn khởi tạo dự án bằng **Next.js (App Router)** hay **Vite + React**? (Khuyến nghị: *Vite + React* nhẹ nhất, khởi động siêu tốc; hoặc *Next.js* nếu bạn muốn sẵn sàng tích hợp Server API & Cloud sau này).
