import { Subject } from './tree-types';
import { CornellNote } from './cornell-types';
import { Card } from './types';
import { formatFileSize } from './file-utils';

export interface DigestOptions {
  includeOverview?: boolean;
  includeCornellNotes?: boolean;
  includeHighlights?: boolean;
  includeFlashcards?: boolean;
  includeFileList?: boolean;
  authorName?: string;
}

export interface SubjectDigestResult {
  title: string;
  fileName: string;
  markdown: string;
  totalWeeks: number;
  totalNotes: number;
  totalHighlights: number;
  totalCards: number;
  generatedAt: string;
}

/**
 * Đóng gói toàn bộ tài liệu, ghi chú Cornell, trích dẫn bút nhớ và Flashcards của một môn học thành Cẩm nang ôn thi Markdown
 */
export function generateSubjectDigest(
  subject: Subject,
  allCornellNotes: CornellNote[] = [],
  allCards: Card[] = [],
  options: DigestOptions = {}
): SubjectDigestResult {
  const {
    includeOverview = true,
    includeCornellNotes = true,
    includeHighlights = true,
    includeFlashcards = true,
    includeFileList = true,
    authorName = 'Kai'
  } = options;

  const subjectCode = subject.code ? ` (${subject.code.toUpperCase()})` : '';
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN');
  const timestampStr = now.toLocaleString('vi-VN');

  // 1. Thu thập dữ liệu liên quan
  const subjectNameLower = subject.name.toLowerCase().trim();
  const subjectCodeLower = (subject.code || '').toLowerCase().trim();

  // Lọc Cornell Notes của môn học
  const matchedCornellNotes = allCornellNotes.filter((note) => {
    const group = (note.subjectGroup || '').toLowerCase();
    const title = (note.title || '').toLowerCase();
    return (
      (subjectNameLower && (group.includes(subjectNameLower) || subjectNameLower.includes(group) || title.includes(subjectNameLower))) ||
      (subjectCodeLower && (group.includes(subjectCodeLower) || title.includes(subjectCodeLower)))
    );
  });

  // Lọc Highlights từ các file trong môn học
  interface ExtractedHighlight {
    weekNumber: number;
    fileName: string;
    text: string;
    note?: string;
    color: string;
  }
  const extractedHighlights: ExtractedHighlight[] = [];
  (subject.weeks || []).forEach((week) => {
    (week.files || []).forEach((file) => {
      if (file.highlights && file.highlights.length > 0) {
        file.highlights.forEach((hl) => {
          extractedHighlights.push({
            weekNumber: week.weekNumber,
            fileName: file.name,
            text: hl.text,
            note: hl.note,
            color: hl.color
          });
        });
      }
    });
  });

  // Lọc Cards liên quan đến môn học
  const matchedCards = allCards.filter((card) => {
    const textSearch = `${card.title} ${card.tags.join(' ')} ${card.front} ${card.back}`.toLowerCase();
    return (
      (subjectNameLower && textSearch.includes(subjectNameLower)) ||
      (subjectCodeLower && textSearch.includes(subjectCodeLower))
    );
  });

  // 2. Xây dựng nội dung Markdown
  const lines: string[] = [];

  // Header
  lines.push(`# CẨM NANG ÔN TẬP MÔN HỌC: ${subject.name.toUpperCase()}${subjectCode}`);
  lines.push(`> 📘 **Hệ Thống:** Auto Learning Workspace · **Tác giả:** Biên soạn bởi: ${authorName}`);
  lines.push(`> 📅 **Thời gian xuất bản:** ${timestampStr} · **Phiên bản:** Tổng hợp cấp tốc`);
  lines.push('');

  if (subject.description) {
    lines.push(`**Mô tả môn học:** ${subject.description}`);
    lines.push('');
  }

  // I. Mục lục và cấu trúc lộ trình
  if (includeOverview) {
    lines.push('---');
    lines.push('## 🗺️ I. MỤC LỤC & CẤU TRÚC LỘ TRÌNH');
    lines.push(`- **Tổng số tuần học:** ${(subject.weeks || []).length} tuần`);
    lines.push(`- **Số bài ghi chú Cornell:** ${matchedCornellNotes.length} bài`);
    lines.push(`- **Số đoạn trích dẫn cốt lõi:** ${extractedHighlights.length} trích dẫn`);
    lines.push(`- **Số thẻ Flashcard SRS:** ${matchedCards.length} thẻ`);
    lines.push('');
    lines.push('### Danh Sách Các Tuần Học:');
    if (!subject.weeks || subject.weeks.length === 0) {
      lines.push('*Chưa có tuần học nào được thiết lập trong môn học này.*');
    } else {
      subject.weeks.forEach((w) => {
        lines.push(`- **Tuần ${w.weekNumber}:** ${w.title} *(${(w.files || []).length} tệp tin)*`);
      });
    }
    lines.push('');
  }

  // II. Ghi chú chuẩn Cornell
  if (includeCornellNotes && matchedCornellNotes.length > 0) {
    lines.push('---');
    lines.push('## 📝 II. BỘ GHI CHÚ CHUẨN CORNELL (CORNELL NOTES KNOWLEDGE BASE)');
    matchedCornellNotes.forEach((note, idx) => {
      lines.push(`### ${idx + 1}. ${note.title} ${note.weekNumber ? `(Tuần ${note.weekNumber})` : ''}`);
      if (note.tags && note.tags.length > 0) {
        lines.push(`*Chủ đề:* \`${note.tags.join('`, `')}\``);
      }
      lines.push('');

      // Cues
      if (note.cues && note.cues.length > 0) {
        lines.push('#### 🔑 Cues & Câu Hỏi Gợi Nhớ (Active Recall):');
        note.cues.forEach((c) => {
          lines.push(`- **${c.cue}**`);
          if (c.referenceAnswer) {
            lines.push(`  ↳ *Gợi ý trả lời:* ${c.referenceAnswer}`);
          }
        });
        lines.push('');
      }

      // Notes
      lines.push('#### 📖 Nội Dung Chi Tiết:');
      lines.push(note.notes || '*Không có nội dung ghi chú.*');
      lines.push('');

      // Summary
      if (note.summary) {
        lines.push('#### 🎯 Tóm Tắt Cốt Lõi:');
        lines.push(`> ${note.summary}`);
        lines.push('');
      }
    });
  }

  // III. Tuyển tập trích dẫn / Bút nhớ dòng
  if (includeHighlights && extractedHighlights.length > 0) {
    lines.push('---');
    lines.push('## 💡 III. TUYỂN TẬP TRÍCH DẪN & BÚT NHỚ DÒNG (HIGH-YIELD QUOTES)');
    extractedHighlights.forEach((hl, idx) => {
      lines.push(`**${idx + 1}. [Tuần ${hl.weekNumber} · ${hl.fileName}]**`);
      lines.push(`> "${hl.text}"`);
      if (hl.note) {
        lines.push(`*Ghi chú cá nhân:* ${hl.note}`);
      }
      lines.push('');
    });
  }

  // IV. Bộ thẻ Flashcard
  if (includeFlashcards && matchedCards.length > 0) {
    lines.push('---');
    lines.push('## 🧠 IV. BỘ THẺ FLASHCARD TỰ LUẬN & TRẮC NGHIỆM (FLASHCARD VAULT)');
    matchedCards.forEach((c, idx) => {
      lines.push(`### Thẻ ${idx + 1}: ${c.title}`);
      lines.push(`- **Hỏi:** ${c.front}`);
      lines.push(`- **Đáp:** ${c.back}`);
      if (c.codeSnippet) {
        lines.push('```' + (c.codeLanguage || ''));
        lines.push(c.codeSnippet);
        lines.push('```');
      }
      lines.push('');
    });
  }

  // V. Danh mục tài liệu tham khảo
  if (includeFileList) {
    lines.push('---');
    lines.push('## 📂 V. DANH MỤC TÀI LIỆU & TỆP TIN THAM KHẢO');
    if (!subject.weeks || subject.weeks.length === 0) {
      lines.push('*Chưa có tài liệu đính kèm.*');
    } else {
      subject.weeks.forEach((w) => {
        lines.push(`### Tuần ${w.weekNumber}: ${w.title}`);
        if (!w.files || w.files.length === 0) {
          lines.push('- *(Không có file nào trong tuần này)*');
        } else {
          w.files.forEach((f) => {
            lines.push(`- 📄 **${f.name}** (\`.${f.extension}\`, ${formatFileSize(f.size)})`);
          });
        }
        lines.push('');
      });
    }
  }

  // Footer
  lines.push('---');
  lines.push(`*Được đóng gói tự động bởi Auto Learning System • Ngày ${dateStr}*`);

  return {
    title: `Cẩm Nang Ôn Tập: ${subject.name}${subjectCode}`,
    fileName: `Cam_Nang_${subject.name.replace(/[^a-zA-Z0-9À-ỹ]/g, '_')}.md`,
    markdown: lines.join('\n'),
    totalWeeks: (subject.weeks || []).length,
    totalNotes: matchedCornellNotes.length,
    totalHighlights: extractedHighlights.length,
    totalCards: matchedCards.length,
    generatedAt: timestampStr
  };
}

/**
 * Tải file Markdown cẩm nang về thiết bị người dùng
 */
export function downloadStudyDigestMarkdown(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
