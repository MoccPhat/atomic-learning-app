import { QuizQuestion } from './quiz-types';

interface QuestionDraft {
  n: number;
  chapter?: string;
  stemLines: string[];
  options: { key: string; text: string }[];
  answer: string;
  explainLines: string[];
  noteLines: string[];
}

const RX = {
  qHead: /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:Câu|Cau|Question|Q)\s*(\d+)(?:\s*[:.)]|\s|$)\s*(?:\*\*)?\s*(.*)$/i,
  qNumbered: /^\s*(\d{1,3})[.)]\s+(.*)$/,
  option: /^\s*(?:[-*+]\s+)?(?:\*\*)?\(?([A-Ha-h])[.)]\s*(?:\*\*)?\s*(.*?)\s*$/,
  answer: /^\s*(?:[-*]\s*)?(?:\*\*)?\s*(?:Đáp án|Dap an|Answer|Key|Correct)\s*(?:đúng)?\s*(?:là)?\s*(?:\*\*)?\s*[:：]?\s*(?:\*\*)?\s*(.*)$/i,
  explain: /^\s*(?:[-*]\s*)?(?:\*\*)?\s*(?:Giải thích|Giai thich|Explanation|Lời giải)\s*(?:\*\*)?\s*[:：]?\s*(?:\*\*)?\s*(.*)$/i,
  field: /^\s*(?:[-*]\s*)?(?:\*\*)?\s*(?:Độ chắc chắn|Nguồn đối chiếu|Nguồn|Ghi chú|Note|Mức độ|Độ khó|Tags?)\s*(?:\*\*)?\s*[:：]/i,
  chapter: /^\s*#{1,6}\s+(.*)$/,
  skipStem: /^(?:\*\*)?\s*(?:\[[^\]]+\]\s*)?(?:chọn\s*(?:một|1)?\s*đáp án(?:\s*đúng)?|chọn\s*câu\s*(?:trả lời\s*)?đúng)\s*[:.]?\s*(?:\*\*)?\s*$|^\**\[TÁI DỰNG\]/i,
  hr: /^\s*(-{3,}|\*{3,}|_{3,})\s*$/,
};

function stripMd(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/(^|\s)\*(\S.*?\S)\*(?=\s|$)/g, '$1$2').trim();
}

function cleanStem(s: string): string {
  return s
    .replace(/\*\*\[[^\]]+\]\*\*/g, '')
    .replace(/\[THẦY\]|\[THAY\]/gi, '')
    .replace(/^\s*(?:\*\*)?(?:Câu|Cau)\s*\d+\s*[:.]?\s*(?:\*\*)?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function guessQuizTitle(text: string, fallback: string = 'Đề trắc nghiệm mới'): string {
  const line = text.split(/\r?\n/).find((l) => /^\s*#\s+\S/.test(l) && !RX.qHead.test(l));
  return (line ? line.replace(/^\s*#\s+/, '').replace(/[*_`]/g, '') : fallback).trim() || fallback;
}

export function parseMarkdownQuiz(text: string): { questions: QuizQuestion[]; skipped: number } {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const questions: QuizQuestion[] = [];
  let chapter = '';
  let cur: QuestionDraft | null = null;
  let stage: 'stem' | 'options' | 'after' = 'stem';
  let skipped = 0;
  let lastField: 'explain' | 'note' | null = null;

  const usesCauHeader = lines.some((l) => RX.qHead.test(l) && !/^\s*[-*+]\s/.test(l));

  function finish() {
    const c = cur;
    if (!c) return;
    const stem = cleanStem(c.stemLines.join(' '));
    const explain = c.explainLines.join('\n').trim();
    const note = c.noteLines.join('\n').trim();

    if (stem && c.options.length >= 2 && c.answer && c.options.some((o) => o.key === c.answer)) {
      questions.push({
        n: c.n,
        chapter: c.chapter,
        stem,
        options: c.options,
        answer: c.answer,
        explain: explain || undefined,
        note: note || undefined,
      });
    } else if (c.options.length || c.answer) {
      skipped++;
    }
    cur = null;
  }

  function start(n: number, rest: string) {
    finish();
    cur = {
      n,
      chapter: chapter || undefined,
      stemLines: [],
      options: [],
      answer: '',
      explainLines: [],
      noteLines: [],
    };
    stage = 'stem';
    lastField = null;
    if (rest && rest.trim()) cur.stemLines.push(rest.trim());
  }

  for (const raw of lines) {
    const line = raw.replace(/\t/g, ' ');
    if (RX.hr.test(line)) {
      lastField = null;
      continue;
    }

    // 1) Bắt đầu câu hỏi
    const mHead = line.match(RX.qHead);
    if (mHead && !/^\s*[-*+]\s/.test(line)) {
      const looksLikeHeader = /^\s*(#|\*\*)/.test(line) || /^\s*(?:Câu|Cau|Question|Q)\s*\d+\s*[:.)]/i.test(line);
      if (!cur || stage !== 'after' || looksLikeHeader) {
        start(+mHead[1], mHead[2]);
        continue;
      }
    }

    if (!usesCauHeader && (!cur || stage !== 'stem')) {
      const mNumbered = line.match(RX.qNumbered);
      if (mNumbered) {
        if (!cur) {
          start(+mNumbered[1], mNumbered[2]);
          continue;
        } else if (+mNumbered[1] === (cur as QuestionDraft).n + 1) {
          start(+mNumbered[1], mNumbered[2]);
          continue;
        }
      }
    }

    // 2) Tiêu đề chương
    const mChapter = line.match(RX.chapter);
    if (mChapter) {
      if (!cur || stage === 'after' || (cur as QuestionDraft).options.length === 0) {
        finish();
        chapter = mChapter[1].replace(/[*_`]/g, '').trim();
        continue;
      }
    }

    if (!cur) continue;
    const current: QuestionDraft = cur;

    // 3) Đáp án đúng
    const mAnswer = line.match(RX.answer);
    if (mAnswer && current.options.length) {
      const body = mAnswer[1].replace(/[*_`]/g, '').trim();
      let k = body.match(/^\(?([A-Ha-h])(?![\p{L}\p{N}])/u);
      if (!k) {
        const all = [...body.matchAll(/(?:^|[^\p{L}\p{N}])([A-H])(?![\p{L}\p{N}])/gu)];
        if (all.length === 1) k = all[0];
      }
      if (k) current.answer = k[1].toUpperCase();
      stage = 'after';
      lastField = null;
      continue;
    }

    // 4) Lời giải thích
    const mExplain = line.match(RX.explain);
    if (mExplain && current.options.length) {
      if (mExplain[1].trim()) current.explainLines.push(mExplain[1].trim());
      stage = 'after';
      lastField = 'explain';
      continue;
    }

    // 5) Trường phụ (Ghi chú)
    if (RX.field.test(line)) {
      const isNote = /Ghi chú|Note/i.test(line);
      stage = 'after';
      if (isNote) {
        current.noteLines.push(line.replace(/^\s*[-*]?\s*(?:\*\*)?\s*(?:Ghi chú|Note)[\s:：*]*/i, '').trim());
        lastField = 'note';
      } else {
        lastField = null;
      }
      continue;
    }

    // 6) Các lựa chọn (A, B, C, D...)
    const mOpt = line.match(RX.option);
    if (mOpt && stage !== 'after') {
      const key = mOpt[1].toUpperCase();
      const expected = String.fromCharCode(65 + current.options.length);
      if (key === expected) {
        current.options.push({ key, text: stripMd(mOpt[2]) });
        stage = 'options';
        lastField = null;
        continue;
      }
    }

    // 7) Dòng thường
    const t = line.trim();
    if (!t) {
      if (stage === 'after') lastField = null;
      continue;
    }
    if (stage === 'stem') {
      if (!RX.skipStem.test(t)) current.stemLines.push(t);
    } else if (stage === 'options') {
      if (current.options.length) current.options[current.options.length - 1].text += ' ' + stripMd(t);
    } else if (lastField === 'explain') {
      current.explainLines.push(t);
    } else if (lastField === 'note') {
      current.noteLines.push(t);
    }
  }

  finish();
  return { questions, skipped };
}

export const SAMPLE_QUIZ_MD = `# Ôn tập Kiến thức Công nghệ & Lập trình

## Chương 1. Mạng máy tính & Web
### Câu 1
Giao thức nào là giao thức truyền tải siêu văn bản có bảo mật (mã hóa SSL/TLS) cho các trang web?
A. FTP
B. SMTP
C. HTTPS
D. DNS
Đáp án: C
Giải thích: HTTPS (Hypertext Transfer Protocol Secure) sử dụng chứng chỉ SSL/TLS để mã hóa dữ liệu giữa trình duyệt và máy chủ.

### Câu 2
Địa chỉ IPv4 có tổng cộng bao nhiêu bit?
A. 16 bit
B. 32 bit
C. 64 bit
D. 128 bit
Đáp án: B
Giải thích: IPv4 có độ dài 32 bit được chia làm 4 octet, trong khi IPv6 có độ dài 128 bit.

## Chương 2. Cơ sở dữ liệu & Cấu trúc dữ liệu
### Câu 3
Cấu trúc dữ liệu nào hoạt động theo cơ chế LIFO (Last In First Out)?
A. Queue (Hàng đợi)
B. Stack (Ngăn xếp)
C. Linked List (Danh sách liên kết)
D. Array (Mảng tĩnh)
Đáp án: B
Giải thích: Stack đưa phần tử vào cuối cùng sẽ được lấy ra đầu tiên (LIFO). Queue hoạt động theo FIFO (First In First Out).

### Câu 4
Trong chuẩn RESTful API, phương thức HTTP nào thường được dùng để cập nhật một phần dữ liệu của tài nguyên?
A. GET
B. POST
C. PATCH
D. DELETE
Đáp án: C
Giải thích: PATCH dùng để cập nhật một phần (partial update), còn PUT dùng để thay thế toàn bộ tài nguyên.
`;
