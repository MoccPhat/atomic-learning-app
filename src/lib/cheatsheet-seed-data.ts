import { CheatSheetItem } from './cheatsheet-types';

export const INITIAL_CHEATSHEETS: CheatSheetItem[] = [
  // 1. GIT & DEVOPS
  {
    id: 'cs-git-undo',
    title: 'Hủy commit gần nhất nhưng giữ lại code đã sửa',
    category: 'devops',
    syntax: 'git reset --soft HEAD~1',
    explanation: 'Rút lại commit gần nhất, đưa tất cả thay đổi về trạng thái staged để sửa lại message hoặc bổ sung file.',
    example: 'git reset --soft HEAD~1\ngit commit -m "commit mới chuẩn hơn"',
    tags: ['git', 'undo', 'commit', 'devops'],
  },
  {
    id: 'cs-git-stash',
    title: 'Tạm cất code đang làm dở để kéo nhánh mới',
    category: 'devops',
    syntax: 'git stash save "dang_lam_do"\ngit pull origin main\ngit stash pop',
    explanation: 'Lưu tạm thời uncommitted changes vào ngăn xếp stash để workspace sạch sẽ khi đổi branch.',
    example: 'git stash -u # stash cả file untracked',
    tags: ['git', 'stash', 'branch'],
  },
  {
    id: 'cs-docker-exec',
    title: 'Truy cập dòng lệnh bash bên trong Docker Container',
    category: 'devops',
    syntax: 'docker exec -it <container_id_hoac_name> /bin/bash',
    explanation: 'Mở terminal tương tác bên trong container đang chạy để debug file, log hoặc kiểm tra database.',
    example: 'docker exec -it my_postgres_db psql -U postgres',
    tags: ['docker', 'container', 'bash'],
  },
  {
    id: 'cs-linux-ports',
    title: 'Xem tiến trình nào đang chiếm cổng mạng (Port)',
    category: 'devops',
    syntax: 'lsof -i :<port> # hoặc: netstat -ano | findstr :<port>',
    explanation: 'Tra cứu PID của ứng dụng đang nghe trên cổng (port 3000, 5173, 8080) để tắt khi bị xung đột cổng.',
    example: 'kill -9 <PID> # tắt tiến trình',
    tags: ['linux', 'port', 'network', 'lsof'],
  },

  // 2. LẬP TRÌNH (DEV)
  {
    id: 'cs-react-memo-callback',
    title: 'Phân biệt useMemo và useCallback',
    category: 'dev',
    syntax: 'const val = useMemo(() => compute(a), [a]);\nconst fn = useCallback(() => doSomething(a), [a]);',
    explanation: 'useMemo ghi nhớ giá trị kết quả trả về của hàm. useCallback ghi nhớ chính bản thân định nghĩa của hàm đó để tránh re-render component con.',
    example: 'useMemo(() => data.filter(...), [data])',
    tags: ['react', 'hooks', 'optimization', 'javascript'],
  },
  {
    id: 'cs-sql-window-row-number',
    title: 'Phân trang & Xếp hạng bằng Window Function (ROW_NUMBER)',
    category: 'dev',
    syntax: 'SELECT *, ROW_NUMBER() OVER(PARTITION BY department_id ORDER BY salary DESC) as rank\nFROM employees;',
    explanation: 'Đánh số thứ tự tăng dần cho từng dòng dữ liệu trong từng nhóm phân vùng (PARTITION BY).',
    example: 'Dùng kết hợp CTE để lấy Top 1 người lương cao nhất mỗi phòng ban.',
    tags: ['sql', 'database', 'window-function'],
  },
  {
    id: 'cs-py-list-comprehension',
    title: 'List Comprehension lọc và biến đổi trong Python',
    category: 'dev',
    syntax: '[biến_đổi(x) for x in danh_sách if điều_kiện(x)]',
    explanation: 'Cú pháp tinh gọn, tốc độ thực thi nhanh hơn vòng for truyền thống nhờ tối ưu hóa cấp CPython bytecode.',
    example: 'even_squares = [x**2 for x in range(10) if x % 2 == 0]',
    tags: ['python', 'syntax', 'list-comprehension'],
  },

  // 3. TOÁN HỌC & KHOA HỌC (MATH)
  {
    id: 'cs-math-gradient-descent',
    title: 'Công thức Cập nhật Trọng số Gradient Descent',
    category: 'math',
    syntax: 'theta := theta - alpha * (1/m) * sum((h_theta(x) - y) * x)',
    explanation: 'Quy tắc cập nhật trọng số trong bài toán hồi quy tuyến tính: alpha là learning rate, gradient là đạo hàm riêng của hàm mất mát MSE.',
    example: 'W = W - lr * dW',
    tags: ['math', 'machine-learning', 'gradient-descent'],
  },
  {
    id: 'cs-math-derivative-rules',
    title: 'Đạo hàm Tích và Đạo hàm Thương',
    category: 'math',
    syntax: '(u * v)\' = u\'v + uv\'\n(u / v)\' = (u\'v - uv\') / v^2',
    explanation: 'Hai quy tắc đạo hàm nền tảng trong giải tích vi tích phân đối với tích và thương của hai hàm số.',
    example: '(x * sin(x))\' = 1*sin(x) + x*cos(x) = sin(x) + x*cos(x)',
    tags: ['math', 'calculus', 'derivative'],
  },

  // 4. NGOẠI NGỮ (ENGLISH)
  {
    id: 'cs-en-inversion',
    title: 'Cấu trúc Đảo ngữ nâng cao (Inversion)',
    category: 'english',
    syntax: 'Not only + trợ_động_từ + S + V, but S + also + V\nHardly had + S + V3/ed + when + S + V2/ed',
    explanation: 'Cấu trúc đảo ngữ tạo ấn tượng mạnh về ngữ pháp cho bài viết luận và nói Band 7.5+.',
    example: 'Not only is artificial intelligence transforming industries, but it also creates novel career pathways.',
    tags: ['english', 'ielts', 'grammar', 'inversion'],
  },
  {
    id: 'cs-en-cleft-sentence',
    title: 'Câu Chẻ nhấn mạnh ý chính (Cleft Sentences)',
    category: 'english',
    syntax: 'It is/was + [thành_phần_nhấn_mạnh] + that/who + ...',
    explanation: 'Nhấn mạnh chủ ngữ, tân ngữ hoặc trạng ngữ chỉ nơi chốn/thời gian.',
    example: 'It was continuous persistence that helped Kai master data structures and algorithms.',
    tags: ['english', 'ielts', 'writing', 'cleft-sentence'],
  },

  // 5. REGEX (BIỂU THỨC CHÍNH QUY)
  {
    id: 'cs-regex-email',
    title: 'Biểu thức chính quy kiểm tra định dạng Email hợp lệ',
    category: 'regex',
    syntax: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    explanation: 'Kiểm tra tên hòm thư, ký tự @, tên miền và phần đuôi tên miền (tối thiểu 2 ký tự).',
    example: 'user.name+tag@example.edu.vn',
    tags: ['regex', 'validation', 'email'],
  },
  {
    id: 'cs-regex-phone-vn',
    title: 'Kiểm tra số điện thoại di động Việt Nam (10 số)',
    category: 'regex',
    syntax: '^(0|\\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$',
    explanation: 'Khớp tất cả các đầu số mạng Viettel, Vinaphone, Mobifone, Vietnamobile, Gmobile.',
    example: '0901234567 hoặc +84988123456',
    tags: ['regex', 'validation', 'phone', 'vietnam'],
  },
];
