import { getGeminiApiKey, getScannerSettings } from './scanner-service';

export interface SocraticCritique {
  score: number; // 0 - 100
  summary: string;
  strengths: string[];
  jargons: string[]; // Thuật ngữ quá khó chưa được giải nghĩa
  misconceptions: string[]; // Lỗ hổng tư duy hoặc sai sót bản chất
  socraticQuestions: string[]; // 2 câu hỏi phản biện sâu
  analogySuggestion: string; // Phép ẩn dụ đời thường gợi ý
  isAiGenerated: boolean;
}

// Từ điển thuật ngữ chuyên ngành phổ biến
const COMMON_JARGONS = [
  'tối ưu hóa', 'bất đồng bộ', 'bộ nhớ đệm', 'tính toàn vẹn', 'đa luồng',
  'đa tiến trình', 'tham chiếu', 'con trỏ', 'đệ quy', 'bảng băm',
  'độ phức tạp', 'nén dữ liệu', 'giao thức', 'hạ tầng', 'trừu tượng hóa',
  'kế thừa', 'đóng gói', 'đa hình', 'singleton', 'middleware', 'asynchronous',
  'synchronous', 'algorithm', 'concurrency', 'latency', 'throughput', 'bandwidth',
];

/**
 * Đánh giá lời giải thích theo nguyên lý Feynman (Chế độ Offline Heuristic)
 */
export function evaluateFeynmanOffline(topic: string, explanation: string): SocraticCritique {
  const words = explanation.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = explanation.toLowerCase();

  const foundJargons: string[] = [];
  COMMON_JARGONS.forEach((j) => {
    if (lower.includes(j)) {
      foundJargons.push(j);
    }
  });

  const hasAnalogy =
    lower.includes('ví dụ') ||
    lower.includes('như là') ||
    lower.includes('giống như') ||
    lower.includes('tưởng tượng') ||
    lower.includes('chẳng hạn');

  const strengths: string[] = [];
  const misconceptions: string[] = [];

  // Tính điểm cơ sở
  let score = 50;

  if (wordCount >= 20 && wordCount <= 200) {
    strengths.push('Độ dài súc tích, đi thẳng vào trọng tâm vấn đề.');
    score += 15;
  } else if (wordCount < 20) {
    misconceptions.push('Lời giải thích quá ngắn, chưa đủ diễn đạt cơ chế hoạt động thực tế.');
    score -= 15;
  } else {
    misconceptions.push('Lời giải thích hơi dài dòng, có nguy cơ làm người mới bị ngợp thông tin.');
  }

  if (hasAnalogy) {
    strengths.push('Có sử dụng ví dụ hoặc hình ảnh minh họa cụ thể đời thường.');
    score += 20;
  } else {
    misconceptions.push('Chưa có ví dụ so sánh đời thường (analogy) giúp người nghe dễ hình dung.');
  }

  if (foundJargons.length === 0) {
    strengths.push('Sử dụng ngôn ngữ bình dị, tránh được bẫy lạm dụng thuật ngữ kỹ thuật.');
    score += 15;
  } else {
    score -= Math.min(20, foundJargons.length * 5);
  }

  score = Math.max(20, Math.min(95, score));

  return {
    score,
    summary:
      score >= 75
        ? `Bạn đã nắm bắt rất tốt bản chất của "${topic}". Lời giải thích tương đối sáng sủa.`
        : `Lời giải thích về "${topic}" còn mang tính sách vở hoặc chưa làm rõ được câu hỏi "Tại sao?".`,
    strengths,
    jargons: foundJargons,
    misconceptions,
    socraticQuestions: [
      `Nếu một đứa trẻ 10 tuổi hỏi: "Tại sao chúng ta phải cần đến ${topic} thay vì làm theo cách thông thường?", bạn sẽ trả lời thế nào?`,
      `Trường hợp xấu nhất hoặc tình huống nào thì ${topic} sẽ gặp trục trặc/thất bại?`,
    ],
    analogySuggestion: `Hãy thử tưởng tượng ${topic} giống như một quy trình quen thuộc trong đời sống (ví dụ: nhân viên bưu điện phát thư, đầu bếp nấu ăn, hoặc quầy xếp hàng siêu thị).`,
    isAiGenerated: false,
  };
}

/**
 * Đánh giá lời giải thích bằng Google Gemini AI (Chế độ Socratic Coach Online)
 */
export async function critiqueExplanationWithGemini(
  topic: string,
  explanation: string
): Promise<SocraticCritique> {
  const apiKey = getGeminiApiKey();

  // Nếu không có API Key, chuyển sang chế độ Heuristic Offline
  if (!apiKey) {
    return evaluateFeynmanOffline(topic, explanation);
  }

  const { model } = getScannerSettings();
  const selectedModel =
    !model || model === 'gemini-2.5-flash' || model === 'gemini-1.5-flash'
      ? 'gemini-3.5-flash'
      : model;

  const systemPrompt = `Bạn là Richard Feynman và nhà triết học Socrates kết hợp lại thành "Socratic Learning Coach".
Nhiệm vụ của bạn là đánh giá lời giải thích của người học về chủ đề: "${topic}".
Triết lý Feynman: "Nếu bạn không thể giải thích một điều gì đó cho một đứa trẻ 12 tuổi hiểu, nghĩa là bạn chưa thực sự hiểu nó."

Lời giải thích của người học:
"""
${explanation}
"""

Hãy phản biện nghiêm túc, thẳng thắn nhưng đầy khích lệ. BẮT BUỘC trả về kết quả dưới định dạng JSON thuần túy (không bọc trong markdown code fence khác ngoài json) với cấu trúc sau:
{
  "score": <số nguyên từ 1 đến 100>,
  "summary": "<1-2 câu nhận xét tổng quan ngắn gọn>",
  "strengths": ["<điểm sáng 1>", "<điểm sáng 2>"],
  "jargons": ["<từ chuyên môn đao to búa lớn mà người học dùng nhưng chưa giải thích rõ, hoặc để trống [] nếu không có>"],
  "misconceptions": ["<lỗ hổng hiểu biết hoặc điểm giải thích chưa chính xác, hoặc để trống []>"],
  "socraticQuestions": ["<câu hỏi phản biện 1>", "<câu hỏi phản biện 2>"],
  "analogySuggestion": "<Gợi ý 1 phép ẩn dụ đời thường cực kỳ sinh động để mô tả chủ đề này>"
}`;

  try {
    let activeModel = selectedModel;
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    // Fallback sang gemini-3.5-flash nếu model hiện tại trả về 404 hoặc 503
    if ((response.status === 404 || response.status === 503) && activeModel !== 'gemini-3.5-flash') {
      activeModel = 'gemini-3.5-flash';
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
    }

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJsonText) {
      return evaluateFeynmanOffline(topic, explanation);
    }

    const parsed = JSON.parse(rawJsonText);
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 70,
      summary: parsed.summary || 'Nhận xét từ AI Socratic Coach.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      jargons: Array.isArray(parsed.jargons) ? parsed.jargons : [],
      misconceptions: Array.isArray(parsed.misconceptions) ? parsed.misconceptions : [],
      socraticQuestions: Array.isArray(parsed.socraticQuestions) && parsed.socraticQuestions.length > 0
        ? parsed.socraticQuestions
        : [
            `Điều gì sẽ xảy ra nếu ta bỏ hoàn toàn khái niệm này?`,
            `Khi nào khái niệm này không còn áp dụng được?`,
          ],
      analogySuggestion: parsed.analogySuggestion || 'Hãy thử liên hệ với ví dụ thực tế.',
      isAiGenerated: true,
    };
  } catch (err) {
    console.warn('Gemini critique failed, falling back to offline heuristic:', err);
    return evaluateFeynmanOffline(topic, explanation);
  }
}
