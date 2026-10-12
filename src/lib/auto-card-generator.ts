import { getGeminiApiKey } from './scanner-service';
import { addCard } from './storage';
import { addQuizSetFromText } from './quiz-storage';

export interface GeneratedFlashcard {
  title: string;
  front: string;
  back: string;
  selected: boolean;
}

export interface GeneratedQuiz {
  question: string;
  options: { key: string; text: string }[];
  answer: string;
  explanation: string;
  selected: boolean;
}

export interface ExtractionResult {
  flashcards: GeneratedFlashcard[];
  quizzes: GeneratedQuiz[];
  sourceLength: number;
  engineUsed: 'gemini' | 'heuristic';
}

/**
 * Trích xuất Heuristic Offline thông minh (Không cần mạng, không cần API key)
 */
export function extractCardsHeuristically(text: string): ExtractionResult {
  const clean = text.replace(/\r\n/g, '\n').trim();
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  const flashcards: GeneratedFlashcard[] = [];
  const definitions: { term: string; definition: string }[] = [];

  // Mẫu Regex nhận diện định nghĩa tiếng Việt & tiếng Anh (hỗ trợ dấu ngoặc đơn và gạch ngang)
  const patterns = [
    // 1. "Thuật ngữ là ..." hoặc "Thuật ngữ được định nghĩa là..."
    /^([A-ZÀ-Ỹa-zà-ỹ0-9\s_\-\(\)\/]{2,50})\s+(?:là|được hiểu là|được định nghĩa là|nghĩa là|is defined as|refers to|means)\s+[:\-]?\s*(.+)$/i,
    // 2. "Thuật ngữ: Định nghĩa"
    /^([A-ZÀ-Ỹa-zà-ỹ0-9\s_\-\(\)\/]{2,50})\s*[:\-–—]\s*(.+)$/,
  ];

  for (const line of lines) {
    if (line.length < 10) continue;

    // Loại bỏ số thứ tự đầu dòng (1. 2.) hoặc ký tự gạch đầu dòng (*, -, •)
    const cleanLine = line.replace(/^\s*(?:\d+[\.\)]|[*\-•])\s*/, '').trim();

    for (const pat of patterns) {
      const match = cleanLine.match(pat);
      if (match && match[1] && match[2]) {
        const term = match[1].trim();
        const def = match[2].trim();

        if (term.length >= 2 && term.length <= 50 && def.length >= 10) {
          definitions.push({ term, definition: def });
          flashcards.push({
            title: term,
            front: `Khái niệm "${term}" có ý nghĩa gì?`,
            back: def,
            selected: true,
          });
          break;
        }
      }
    }
  }

  // Nếu không tìm thấy đủ theo regex, phân tích theo từng đoạn văn bản ngắn
  if (flashcards.length < 3) {
    const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
    paragraphs.slice(0, 5).forEach((p, idx) => {
      const firstSentence = p.split(/[.?!]/)[0].trim();
      const rest = p.slice(firstSentence.length).trim().replace(/^[.?!]\s*/, '');

      if (firstSentence.length > 5 && rest.length > 15) {
        flashcards.push({
          title: `Ý chính #${idx + 1}`,
          front: firstSentence + '?',
          back: rest || p,
          selected: true,
        });
      }
    });
  }

  // Sinh câu hỏi trắc nghiệm từ các định nghĩa đã tìm được
  const quizzes: GeneratedQuiz[] = [];
  const termPool = definitions.map((d) => d.term);

  definitions.slice(0, 4).forEach((d, _idx) => {
    // Các phương án sai lấy từ các thuật ngữ khác
    const otherTerms = termPool.filter((t) => t !== d.term);
    const wrongDistractors = otherTerms.slice(0, 3);

    // Bổ sung các phương án giả lập nếu thiếu
    while (wrongDistractors.length < 3) {
      wrongDistractors.push(`Phương án mở rộng ${wrongDistractors.length + 1}`);
    }

    const allChoices = [d.term, ...wrongDistractors];
    // Xáo trộn phương án
    const shuffled = [...allChoices].sort(() => Math.random() - 0.5);
    const correctKeyIndex = shuffled.indexOf(d.term);
    const keys = ['A', 'B', 'C', 'D'];
    const correctLetter = keys[correctKeyIndex] || 'A';

    quizzes.push({
      question: `Định nghĩa sau đây mô tả khái niệm nào: "${d.definition.slice(0, 160)}${d.definition.length > 160 ? '...' : ''}"?`,
      options: shuffled.slice(0, 4).map((text, i) => ({
        key: keys[i],
        text,
      })),
      answer: correctLetter,
      explanation: `${d.term} được định nghĩa là: ${d.definition}`,
      selected: true,
    });
  });

  return {
    flashcards: flashcards.slice(0, 8),
    quizzes: quizzes.slice(0, 5),
    sourceLength: clean.length,
    engineUsed: 'heuristic',
  };
}

/**
 * Trích xuất bằng Gemini AI (khi có API key)
 */
export async function extractCardsWithGemini(
  text: string,
  apiKey: string
): Promise<ExtractionResult> {
  const clean = text.trim();
  if (!clean) {
    return { flashcards: [], quizzes: [], sourceLength: 0, engineUsed: 'gemini' };
  }

  const prompt = `Bạn là chuyên gia sư phạm hàng đầu. Hãy phân tích đoạn tài liệu sau và trích xuất:
1. 3 đến 6 thẻ Flashcards (khái niệm cốt lõi, công thức, định nghĩa ngắn gọn, súc tích).
2. 2 đến 4 câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D) kiểm tra khả năng hiểu bản chất.

YÊU CẦU ĐỊNH DẠNG TRẢ VỀ:
Chỉ trả về JSON thuần túy (không kèm markdown codeblock \`\`\`json):
{
  "flashcards": [
    { "title": "Thuật ngữ", "front": "Câu hỏi / Khái niệm", "back": "Định nghĩa / Câu trả lời chi tiết" }
  ],
  "quizzes": [
    {
      "question": "Câu hỏi trắc nghiệm?",
      "options": [
        { "key": "A", "text": "Lựa chọn A" },
        { "key": "B", "text": "Lựa chọn B" },
        { "key": "C", "text": "Lựa chọn C" },
        { "key": "D", "text": "Lựa chọn D" }
      ],
      "answer": "A",
      "explanation": "Giải thích chi tiết vì sao A đúng"
    }
  ]
}

ĐOẠN TÀI LIỆU:
${clean.slice(0, 3500)}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const data = await res.json();
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(candidateText);

    const flashcards: GeneratedFlashcard[] = (parsed.flashcards || []).map(
      (f: any) => ({
        title: f.title || 'Khái niệm',
        front: f.front || '',
        back: f.back || '',
        selected: true,
      })
    );

    const quizzes: GeneratedQuiz[] = (parsed.quizzes || []).map((q: any) => ({
      question: q.question || '',
      options: q.options || [],
      answer: q.answer || 'A',
      explanation: q.explanation || '',
      selected: true,
    }));

    return {
      flashcards,
      quizzes,
      sourceLength: clean.length,
      engineUsed: 'gemini',
    };
  } catch (e) {
    console.warn('Lỗi gọi Gemini AI, tự động chuyển sang chế độ Heuristic Offline:', e);
    return extractCardsHeuristically(text);
  }
}

/**
 * Hàm điều phối chính: Tự động dùng Gemini nếu có API key, ngược lại dùng Offline Heuristic
 */
export async function autoGenerateCardsAndQuizzes(text: string): Promise<ExtractionResult> {
  const apiKey = getGeminiApiKey();
  if (apiKey && apiKey.trim().length > 10) {
    return extractCardsWithGemini(text, apiKey.trim());
  }
  return extractCardsHeuristically(text);
}

/**
 * Lưu các thẻ và câu hỏi được chọn vào hệ thống
 */
export function saveExtractedCardsAndQuizzes(
  result: ExtractionResult,
  targetCategory: string = 'general',
  quizSetName?: string
): { cardsSaved: number; quizzesSaved: number } {
  let cardsSaved = 0;
  let quizzesSaved = 0;

  // 1. Lưu các thẻ Flashcard được chọn
  result.flashcards
    .filter((f) => f.selected && f.front.trim() && f.back.trim())
    .forEach((f) => {
      addCard({
        title: f.title,
        front: f.front,
        back: f.back,
        category: (targetCategory as any) || 'code',
        tags: ['auto-generated'],
      });
      cardsSaved++;
    });

  // 2. Lưu các câu Quiz được chọn
  const selectedQuizzes = result.quizzes.filter(
    (q) => q.selected && q.question.trim() && q.options.length >= 2
  );

  if (selectedQuizzes.length > 0) {
    // Chuyển thành định dạng Markdown Quiz tương thích với Quiz Parser hiện tại
    const mdLines: string[] = [
      `# ${quizSetName || 'Đề trắc nghiệm tạo tự động'}`,
      '',
    ];

    selectedQuizzes.forEach((q, idx) => {
      mdLines.push(`Câu ${idx + 1}: ${q.question}`);
      q.options.forEach((opt) => {
        mdLines.push(`${opt.key}. ${opt.text}`);
      });
      mdLines.push(`Đáp án: ${q.answer}`);
      if (q.explanation) {
        mdLines.push(`Giải thích: ${q.explanation}`);
      }
      mdLines.push('');
    });

    const addRes = addQuizSetFromText(
      mdLines.join('\n'),
      quizSetName || 'Đề trắc nghiệm trích xuất'
    );
    if (addRes.success) {
      quizzesSaved = selectedQuizzes.length;
    }
  }

  return { cardsSaved, quizzesSaved };
}
