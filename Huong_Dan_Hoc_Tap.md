# Hướng Dẫn Sử Dụng: Atomic Learning App (PWA)

Chào bạn, đây là hệ thống học tập cá nhân nguyên tử (**Atomic Learning App**) được thiết kế tối ưu để bạn có thể sử dụng liền mạch trên cả **Máy tính (PC)** và **Điện thoại (Mobile iOS / Android)**.

---

## 🚀 1. Cách Khởi Chạy Ứng Dụng

### Trên Máy tính (PC):
- **Cách 1 (Nhanh nhất):** Nhấp đúp vào file [`Chay_He_Thong_Hoc_Tap.bat`](file:///E:/Tool/Chay_He_Thong_Hoc_Tap.bat). Trình duyệt sẽ tự động mở trang web học tập tại địa chỉ:
  👉 **`http://localhost:5173`**
- **Cách 2:** Mở Terminal tại thư mục `e:\Tool\atomic-learning-app` và gõ:
  ```bash
  npm run dev
  ```

---

## 📱 2. Cách Sử Dụng Trên Điện Thoại (iOS & Android)

Ứng dụng được xây dựng theo chuẩn **Progressive Web App (PWA)**, cho phép bạn cài đặt như một ứng dụng native trên điện thoại mà không cần tải từ App Store hay CH Play:

1. **Kết nối cùng mạng WiFi:** Đảm bảo điện thoại và máy tính kết nối chung mạng WiFi trong nhà.
2. **Xem địa chỉ IP mạng nội bộ:** Khi chạy file `.bat`, màn hình Terminal sẽ hiển thị dòng:
   ```text
   ➜  Network:  http://192.168.x.x:5173/
   ```
3. **Mở trên điện thoại:**
   - Trên **iPhone (Safari):** Nhập địa chỉ IP trên vào trình duyệt Safari $\rightarrow$ Bấm nút **Chia sẻ (Share)** $\rightarrow$ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
   - Trên **Android (Chrome):** Mở trình duyệt Chrome $\rightarrow$ Bấm menu 3 chấm $\rightarrow$ Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.
4. **Trải nghiệm:** Bây giờ bạn có thể mở icon `AtomicLearn` trực tiếp từ màn hình điện thoại, giao diện hiển thị toàn màn hình (không có thanh địa chỉ trình duyệt), mượt mà và hỗ trợ ngoại tuyến (Offline-first).

---

## 🧠 3. Chu Trình Học Tập 4 Lĩnh Vực

### 1. Thu thập kiến thức tức thì (Quick Capture - 3 giây)
- **Trên PC:** Bấm phím tắt **`Ctrl + K`** hoặc **`Ctrl + N`** từ bất kỳ đâu trên trang.
- **Trên Mobile:** Chạm vào nút tròn màu xanh **`+`** ở góc dưới bên phải màn hình.
- Điền tiêu đề, vấn đề cần nhớ (mặt trước) và lời giải thích ngắn gọn (mặt sau).
- Đối với lập trình: Bật tính năng **"Đính kèm đoạn mã code"** để có syntax highlight đẹp mắt.

### 2. Ôn tập ngắt quãng (Active Recall & Spaced Repetition)
- Mỗi ngày, mở ứng dụng và bấm nút **"Bắt đầu ôn tập ngay"**.
- Đọc câu hỏi ở mặt trước $\rightarrow$ Tự suy nghĩ câu trả lời trong đầu (Active Recall) $\rightarrow$ Bấm **Lật xem đáp án** (hoặc ấn phím **Space** trên PC).
- Tự đánh giá mức độ ghi nhớ theo 4 mức (hoặc phím số **1, 2, 3, 4**):
  - **1 - Quên (Again):** Thuật toán sẽ lên lịch ôn lại vào ngày mai.
  - **2 - Khó (Hard):** Lên lịch ôn sau 1-2 ngày.
  - **3 - Nhớ (Good):** Tăng chu kỳ ôn theo chuẩn khoa học.
  - **4 - Dễ (Easy):** Thẻ đã thuộc rất sâu, giãn cách ngày ôn xa hơn.
- Hoàn thành xong tất cả các thẻ trong ngày, hệ thống sẽ bắn pháo hoa ăn mừng 🎉 và cộng thêm **+1 ngày Streak**.

### 3. Hỗ trợ chuyên sâu cho từng lĩnh vực:
- 💻 **Lập trình (Code):** Hiển thị code rõ ràng, có nút **Chép mã (Copy)** nhanh để thử nghiệm vào IDE.
- 🇬🇧 **Ngoại ngữ (English):** Tích hợp nút **Icon Loa** sử dụng Web Speech API chuẩn để phát âm từ vựng tiếng Anh.
- 📖 **Đọc sách (Book):** Áp dụng mô hình ghi chú nguyên tử (Atomic Note), mỗi thẻ chỉ chứa đúng 1 tư tưởng/bài học đắt giá.
- 🎯 **Ôn thi cử (Exam):** Luyện phản xạ nhanh các câu hỏi trắc nghiệm và kiến thức nền tảng.

---

## 💾 4. Sao Lưu & Đồng Bộ Dữ Liệu An Toàn

- Dữ liệu được lưu trực tiếp trên thiết bị của bạn (**Local-First**), đảm bảo tốc độ tức thì và bảo mật tuyệt đối.
- Bấm vào biểu tượng **Bánh răng (Cài đặt)** ở góc trên bên phải để:
  - **Xuất file sao lưu (Export JSON):** Tải toàn bộ thẻ và streak về máy lưu trữ an toàn.
  - **Nhập dữ liệu (Import JSON):** Nạp dữ liệu từ file sao lưu để chuyển đổi giữa máy tính và điện thoại dễ dàng.

---

## 📝 5. Luyện Thi Trắc Nghiệm (Quiz Master - Tích hợp từ Web_TracNghiem)

Tính năng trắc nghiệm từ thư mục `E:\Web_TracNghiem` đã được tích hợp trực tiếp vào thanh Menu bên trái của ứng dụng:

1. **Vào mục "Bộ đề trắc nghiệm":** Mở Menu bên trái $\rightarrow$ Chọn **"Bộ đề trắc nghiệm"**.
2. **Nạp đề thi linh hoạt:**
   - **Nạp file `.md`:** Chọn trực tiếp file câu hỏi Markdown từ máy tính (ví dụ file `MAU-CAU-HOI.md`).
   - **Dán văn bản Markdown:** Nhấn nút **"Dán văn bản"** và paste nội dung câu hỏi vào.
   - **Nhờ AI soạn đề tự động:** Bấm vào biểu tượng dấu hỏi **?** để sao chép câu lệnh Prompt chuẩn gửi cho ChatGPT/Gemini tạo 20-30 câu hỏi theo chủ đề bất kỳ.
3. **Làm bài thi phản xạ thông minh:**
   - Hỗ trợ phím số **1-4** hoặc phím chữ **A-D** trên máy tính; chạm cảm ứng trên điện thoại.
   - **Khi chọn sai:** Gạch ngang đáp án sai, đổi màu đỏ và cho phép chọn lại ngay lập tức (không bị bế tắc).
   - **Khi chọn đúng:** Tự động hiện giải thích chi tiết, ấn phím **Enter** để qua câu kế tiếp.
4. **Bảng điểm & Ôn luyện câu sai:**
   - Sau khi hoàn thành, hệ thống thống kê số câu đúng ngay lần đầu và tỷ lệ phần trăm.
   - Có nút **"Chỉ luyện lại các câu đã sai"** giúp bạn củng cố ngay các lỗ hổng kiến thức mà không phải làm lại từ đầu cả bài.

---

## 📸 6. Quét & Số Hóa Tài Liệu (Scanner AI & Layout Preserver)

Tính năng Scanner giúp bạn tiết kiệm 90% thời gian nhập liệu từ tài liệu giấy, sách giáo trình, đề thi hoặc màn hình code:

1. **Mở Scanner:** Nhấn vào **"Quét tài liệu (Scanner)"** ở Menu bên trái hoặc nút bấm trên thanh đầu trang.
2. **Nạp ảnh tài liệu:**
   - Kéo thả tệp ảnh vào khung, hoặc bấm **"Chọn tệp ảnh"** / **"Chụp ảnh"** từ Camera điện thoại.
   - Phím tắt **`Ctrl + V`**: Chụp màn hình (`Win + Shift + S`) rồi bấm `Ctrl + V` vào trang là ảnh tải lên ngay lập tức!
3. **Cấu hình Engine:**
   - ⚡ **AI Vision (Gemini Flash):** Nhận diện chữ in, chữ viết tay, công thức Toán KaTeX (`$$...$$`), mã nguồn lập trình có thụt lề, và câu hỏi trắc nghiệm A-B-C-D.
   - 📴 **Ngoại tuyến (Tesseract.js):** Chạy 100% trong trình duyệt không cần mạng.
4. **Textarea Bảo Toàn Bố Cục:**
   - Kết quả hiển thị trong khung Textarea có font Monospace, giữ nguyên từng khoảng cách thụt lề (indentation).
   - Tự động gắn huy hiệu phân tích: Đề trắc nghiệm, Mã nguồn, Công thức Toán.
5. **Hành động 1-chạm:**
   - 🎓 **Tạo Đề Quiz:** Nạp câu hỏi trắc nghiệm trực tiếp vào Quiz Master.
   - 🃏 **Tạo Thẻ Thẻ Học:** Tạo thẻ ghi nhớ vào hệ thống Spaced Repetition.
   - 📁 **Lưu vào Vault:** Lưu thành file `.md` vào Cây Lưu Trữ Tài Liệu.

---

## 🗂 7. Cây Lưu Trữ Tài Liệu & Đếm Ngược Deadline (Vault & Deadlines)

- **Cấu trúc phân tầng 4 cấp:** Khối ngành $\rightarrow$ Môn học $\rightarrow$ Tuần học $\rightarrow$ Thư mục tự gom theo đuôi file (`.docx`, `.ipynb`, `.pdf`, `.py`, `.md`).
- **Xem trước file trực tiếp:** Hỗ trợ đọc Jupyter Notebook (`.ipynb`), file code có tô màu cú pháp, file Markdown và ảnh mà không cần cài phần mềm thứ 3.
- **Đếm ngược Deadline:** Quản lý hạn nộp bài tập, đồ án, lịch thi với đồng hồ đếm ngược thời gian thực, nhắc nhở quá hạn và liên kết trực tiếp với từng tuần môn học.

---

## ⏱ 8. Đồng Hồ Pomodoro & Không Gian Tập Trung (Focus Lofi)

- **Chu kỳ Pomodoro khoa học:** 25 phút tập trung cao độ + 5 phút nghỉ ngơi ngắn.
- **Âm thanh ngoại tuyến (Offline Lofi & Ambient Sound):** Bộ phát âm thanh tạo tiếng mưa rơi, sóng biển, quán cà phê hoặc nhạc lofi giúp tăng cường tập trung, hoạt động offline hoàn toàn.

---

## 🎧 9. Ôn Tập Rảnh Tay Bằng Giọng Nói (Audio Hands-Free Review)

Dành cho khi bạn đang đi bộ, tập thể dục, nấu ăn, hoặc muốn cho mắt nghỉ ngơi sau nhiều giờ nhìn màn hình:

1. **Kích hoạt:** Khi đang ở màn hình Ôn tập thẻ Flashcards, nhấn vào nút **"Rảnh Tay"** (biểu tượng tai nghe) ở góc trên.
2. **Quy trình tự động hóa:**
   - 🔊 Trình duyệt tự phát âm thanh đọc to Câu hỏi / Khái niệm ở mặt trước (tự động phát hiện tiếng Việt hoặc tiếng Anh).
   - ⏳ Đếm ngược thời gian suy nghĩ (mặc định 3 giây, có thể chỉnh 2s/5s/8s) để bạn tự nhớ câu trả lời trong đầu.
   - 🔄 Tự động lật thẻ và đọc Lời giải / Đáp án cốt lõi ở mặt sau.
   - ⏱ Tạm dừng 2.5 giây rồi tự động chấm điểm "Nhớ" và chuyển sang thẻ tiếp theo.
3. **Bộ sinh âm thanh sóng não & Tiếng ồn tập trung (Pure Web Audio Synthesizer):**
   - Bấm vào icon Cài đặt âm thanh để kích hoạt: **Brown Noise** (ấm êm), **Tiếng mưa nhẹ**, **Sóng Alpha (10Hz)** giúp thư giãn tập trung, hoặc **Sóng Gamma (40Hz)** kích thích siêu ghi nhớ.
   - Hoạt động 100% offline, sinh âm thanh thuần bằng thuật toán toán học trong trình duyệt, không tốn 1 byte tải file ngoài.
4. **Phím tắt điều khiển:** Bấm phím **Space** để Tạm dừng/Tiếp tục, phím **Esc** để thoát chế độ rảnh tay.

---

## 🎯 10. Phòng Thi Thử Mô Phỏng & Radar Điểm Yếu (Mock Exam Simulator)

Giúp bạn rèn luyện phản xạ và chịu áp lực phòng thi thật trước kỳ thi chứng chỉ hoặc bài kiểm tra đại học:

1. **Vào phòng thi:** Trong mục **"Bộ đề trắc nghiệm"**, tại bất kỳ bài thi nào, nhấn nút màu vàng **"Thi Thử"**.
2. **Cấu hình thời gian:** Chọn thời lượng thi áp lực (10 phút, 15 phút, 30 phút, 45 phút).
3. **Quy chế phòng thi:**
   - Tự động xáo trộn ngẫu nhiên thứ tự câu hỏi và 4 phương án A, B, C, D.
   - Ẩn hoàn toàn kết quả đúng/sai trong khi làm (Zen mode) để tập trung cao độ.
   - Đồng hồ đếm ngược có cảnh báo đỏ nhấp nháy khi còn dưới 3 phút; tự động nộp bài khi hết giờ.
   - Lưới câu hỏi (Question Navigator Grid): Nhảy nhanh đến câu bất kỳ; bấm phím **F** hoặc icon Cờ để đánh dấu các câu phân vân cần kiểm tra lại trước khi nộp bài.
4. **Biểu đồ Radar Năng Lực 5 Chiều & Bóc tách Lỗ hổng:**
   - Chấm điểm chuẩn thang điểm 10 và tỷ lệ phần trăm chính xác.
   - Vẽ biểu đồ mạng nhện SVG 5 chiều: *Lý thuyết cốt lõi, Cú pháp & Định dạng, Xử lý biên & Ngoại lệ, Ứng dụng & Thực hành, Tư duy giải thuật & Tối ưu*.
   - Cảnh báo chính xác: *"Lỗ hổng kiến thức lớn nhất"* để bạn tập trung bổ khuyết.
5. **1-Click Chuyển Câu Sai Thành Flashcards:**
   - Bấm nút **"Tạo Flashcards từ câu sai"** để tự động đưa toàn bộ câu hỏi làm sai vào chu trình lặp lại ngắt quãng (Spaced Repetition) giúp không bao giờ lặp lại lỗi sai cũ!

---

## 💡 11. Trợ Lý Phản Biện Kiến Thức Feynman (Feynman Socratic Coach)

Áp dụng phương pháp học đỉnh cao của nhà vật lý Richard Feynman: *"Nếu bạn không thể giải thích điều gì đó cho một đứa trẻ 12 tuổi hiểu, nghĩa là bạn chưa thực sự hiểu nó."*

1. **Mở Feynman Coach:** Nhấn vào mục **"Phản biện Feynman"** (biểu tượng bóng đèn sáng) trên Menu bên trái.
2. **Nhập khái niệm & Lời giải thích:**
   - Chọn chủ đề gợi ý hoặc tự nhập khái niệm bạn đang học (ví dụ: *Event Loop trong JS*, *Thuật toán QuickSort*, *Nguyên lý SOLID*, *Định luật bảo toàn năng lượng*).
   - Tự viết lời giải thích bằng ngôn từ đời thường của chính bạn trong khung soạn thảo.
3. **Nhận phản biện từ Socrates:** Bấm **"Phản biện cùng Socrates"**:
   - 🎯 **Thang điểm thấu triệt (1-100):** Đánh giá mức độ đơn giản và đúng trọng tâm.
   - ⚠️ **Jargon Alert (Bẫy thuật ngữ):** Chỉ ra những từ ngữ chuyên ngành sách vở mà bạn dùng để né tránh việc giải thích bản chất thực sự.
   - ❓ **2 Câu hỏi phản biện Socratic:** Đặt ra các tình huống giả định hóc búa để bạn động não sâu hơn.
   - 💡 **Gợi ý phép ẩn dụ (Everyday Analogy):** Đưa ra một ví dụ đời thường sinh động (như nhà hàng, bưu điện, giao thông).
4. **Lưu trữ tri thức:** Bấm **"Lưu thành Flashcard Spaced Repetition"** để cất giữ lời giải thích hoàn thiện nhất vào hệ thống ôn tập dài hạn.

---

## 📖 12. Sổ Tay Tra Cứu Công Thức Bỏ Túi (CheatSheet Vault)

Tra cứu tức thì các cú pháp, lệnh tắt, regex, mẫu thiết kế mà không cần phải rời ứng dụng để tìm Google:

1. **Mở Sổ Tay:** Nhấn vào **"Sổ tay công thức (Cheat Sheet)"** ở Menu bên trái.
2. **Phân loại đa lĩnh vực:**
   - 💻 **Lập trình (Dev):** Git, Docker, Regex, SQL, ES6+, Python, TypeScript, Linux Bash.
   - 📐 **Toán & Khoa học (Math):** Đạo hàm, Tích phân, Đại số tuyến tính, Xác suất thống kê.
   - 🇬🇧 **Ngoại ngữ (Language):** Cấu trúc ngữ pháp trọng điểm, Cụm từ thông dụng, Phrasal Verbs.
   - 🎯 **Chứng chỉ & Ôn thi (Exam):** Công thức kinh tế lượng, Mạng máy tính, An toàn thông tin.
3. **Tìm kiếm thời gian thực (Instant Search):** Tìm theo tên công thức, cú pháp hoặc thẻ tags.
4. **Sao chép 1-Click:** Bấm nút **"Sao chép"** để copy ngay đoạn cú pháp vào bộ nhớ tạm.
5. **Thêm công thức tùy chỉnh:** Bấm **"+ Thêm công thức"** để ghi lại các mẹo, snippet hay của chính bạn.

---

## 🌲 13. Khu Vườn Tập Trung Trồng Cây Ảo (Focus Garden Gamification)

Biến mỗi phiên tập trung Pomodoro thành một trải nghiệm thú vị như trò chơi nuôi cây:

1. **Cơ chế phát triển cây:** Khi bạn khởi động đồng hồ Pomodoro (25 phút), một mầm cây sẽ bắt đầu nảy mầm trong vườn.
2. **Thu hoạch thành công:** Khi hoàn thành trọn vẹn 25 phút tập trung mà không bấm bỏ dở, cây sẽ lớn thành đại thụ xanh tươi và được lưu vĩnh viễn vào khu vườn của bạn.
3. **Hình phạt cây khô:** Nếu bạn hủy phiên học giữa chừng, cây sẽ bị héo khô để nhắc nhở tính kỷ luật.
4. **Đa dạng loài cây:** Mở khóa nhiều giống cây: *Cây Sồi Trí Tuệ (Oak), Cây Thông Kiên Định (Pine), Cây Hoa Anh Đào Thơ Mộng (Sakura), Cây Tre Dẻo Dai (Bamboo)*.
5. **Huy hiệu & Đẳng cấp Người Làm Vườn:** Nâng cấp từ *Người Gieo Mầm* lên *Người Giữ Rừng*, theo dõi tổng số phút tập trung tích lũy.

---

## 🧭 14. Trợ Lý Lộ Trình & Nhắc Nhở Học Tập (Study Advisor)

1. **Radar Sức Khỏe Học Tập (Study Health Radar):** Phân tích toàn diện 4 chỉ số: Tỷ lệ hoàn thành thẻ đến hạn, Tần suất ôn tập, Độ đều đặn Streak, và Tiến độ môn học.
2. **Cảnh báo thông minh:**
   - Phát hiện nguy cơ đứt chuỗi Streak trước khi hết ngày.
   - Cảnh báo bài tập/deadline sắp đến hạn trong Cây Tài Liệu.
   - Đề xuất môn học bị lãng quên cần ôn tập bổ sung ngay hôm nay.

---

## 🧠 15. Sơ Đồ Tư Duy Trực Quan (MindMap Studio)

Kết nối các khái niệm nguyên tử thành một mạng lưới tri thức sống động:

1. **Mở MindMap:** Nhấn vào **"Sơ đồ tư duy (Mindmap)"** ở Menu bên trái hoặc nút bấm trên thanh đầu trang.
2. **Thao tác Canvas linh hoạt:**
   - **Kéo chuột (Pan):** Nhấn giữ chuột trái và kéo để di chuyển vùng nhìn khắp sơ đồ.
   - **Thu phóng (Zoom):** Dùng con lăn chuột hoặc bấm các nút `+` / `-` / `100%` trên thanh công cụ nổi bên dưới.
   - **Trên điện thoại:** Chạm 1 ngón tay để di chuyển; nhúm 2 ngón tay (Pinch) để phóng to/thu nhỏ mượt mà.
3. **Phát triển nhánh ý tưởng:**
   - Rê chuột vào bất kỳ nhánh nào và bấm nút **`+`** để mọc thêm nhánh con mới.
   - Nhấp đúp chuột vào nhánh để chỉnh sửa tiêu đề, ghi chú chi tiết và đổi màu sắc nhận diện.
   - Nút thu gọn `(số nhánh)` giúp bạn giấu bớt các chi tiết sâu để tập trung vào bức tranh tổng thể.
4. **Hai chế độ bố trí tự động (Auto-Layout):**
   - 🌟 **Tỏa 2 bên (Radial Mode):** Nút gốc ở trung tâm, các nhánh con tỏa đều sang trái và phải bằng đường cong Bézier đối xứng cân đối.
   - ➡️ **Cây ngang (Horizontal Mode):** Toàn bộ nhánh phát triển sang bên phải theo dạng cây phân cấp truyền thống.
   - Bấm nút **"Căn chỉnh"** để thuật toán tự động sắp xếp lại toàn bộ vị trí các nhánh thẳng hàng, không bị đè lên nhau.
5. **Liên kết 2 chiều với Ghi chú Cornell:**
   - Khi đang ở Trình Ghi Chú Cornell, chỉ cần bấm nút **"Sinh Mindmap"**, hệ thống sẽ tự động chuyển hóa toàn bộ các câu hỏi Cues và Summary thành một sơ đồ tư duy hoàn chỉnh trong 1 giây.
6. **Sao lưu & Xuất file:**
   - 📋 **Xuất Markdown:** Sao chép cấu trúc Outline phân cấp có thụt đầu dòng vào bộ nhớ tạm.
   - 🖼️ **Xuất file ảnh SVG:** Tải về file đồ họa vector SVG sắc nét tuyệt đối ở mọi kích thước để in ấn hoặc chèn vào báo cáo đồ án.
   - ⌨️ **Phím tắt tiện dụng:** `Ctrl + Z` (Hoàn tác), `Ctrl + Y` (Làm lại), `Enter` (Thêm nhánh con), `Delete` (Xóa nhánh đang chọn).

---

## 🐾 16. Thú Cưng Đồng Hành Học Tập (Focus Pet Companion)

Biến mỗi phút giây học tập trung thành niềm vui và động lực nuôi dưỡng thú cưng ảo:

1. **Hiển thị trực quan khi tập trung:**
   - Khi bạn mở mục **Không Gian Tập Trung (Pomodoro)**, người bạn thú cưng dễ thương sẽ xuất hiện ngay cạnh đồng hồ đếm ngược.
   - Thú cưng sẽ phản ứng sinh động theo trạng thái của bạn: chăm chú đọc sách khi bạn đang tập trung, nhắm mắt ngủ ngoan để không làm bạn xao nhãng, và vui sướng nhảy múa chúc mừng khi chuông kết thúc vang lên.
2. **Bộ sưu tập 6 loài Pet độc đáo:**
   - 🐕 **Chó Shiba Trung Thành:** Luôn tràn đầy năng lượng và nhiệt huyết, cổ vũ bạn qua từng trang sách khó.
   - 🐱 **Mèo Mướp Calico:** Điềm tĩnh, cuộn tròn sưởi ấm tâm hồn bạn trong những giờ học khuya.
   - 🐢 **Rùa Thông Thái:** Đội mũ cử nhân mini, biểu tượng của sự kiên định, kỷ luật thép "chậm mà chắc".
   - 🐟 **Cá Vàng May Mắn:** Bơi lội thảnh thơi trong bể nước trong veo, xua tan căng thẳng học tập.
   - 🦫 **Capybara Điềm Tĩnh:** "Chiến thần thong dong" đội quả cam trên đầu, bình thản trước mọi deadline.
   - 🐹 **Chuột Lang Má Phính:** Ôm hạt hướng dương giòn tan, cần mẫn tích lũy tri thức từng ngày.
3. **Cơ chế nuôi dưỡng & Tiến hóa:**
   - **Hạt dinh dưỡng:** Mỗi phiên học hoàn thành từ 20-25 phút sẽ tặng bạn các túi hạt dinh dưỡng để cho pet ăn.
   - **Điểm kinh nghiệm (EXP) & Lên cấp:** Càng tập trung nhiều phút, pet càng nhận nhiều EXP để thăng cấp.
   - **4 Giai đoạn tiến hóa:** *Bé con (Sơ sinh)* $\rightarrow$ *Năng động (Teen)* $\rightarrow$ *Chững chạc (Adult)* $\rightarrow$ *Huyền thoại (Master)*.
4. **Phòng Thú Cưng (Pet House):**
   - Chuyển sang tab **"Thú cưng (Pet)"** để quản lý cả 6 loài, đổi tên riêng cho pet của bạn và chọn bạn đồng hành yêu thích bất cứ lúc nào.
   - Hỗ trợ sao lưu và khôi phục toàn vẹn dữ liệu thú cưng qua file JSON sao lưu hệ thống.
