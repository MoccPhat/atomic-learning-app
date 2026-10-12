import { TreeData, StoredFile } from './tree-types';
import { decodeStoredFileData, dataUrlToArrayBuffer } from './file-utils';
import { readDocxFromBuffer } from './docx-reader-service';

export interface VaultSearchResult {
  file: StoredFile;
  weekId: string;
  weekTitle: string;
  subjectId: string;
  subjectName: string;
  groupId: string;
  groupName: string;
  matchType: 'filename' | 'content' | 'highlight';
  matchSnippet?: string;
  lineIndex?: number;
}

/**
 * Tạo đoạn trích dẫn (snippet) xung quanh từ khóa tìm kiếm
 */
export function extractSnippetAroundKeyword(text: string, query: string, maxLength: number = 140): string {
  if (!text || !query) return '';
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text.slice(0, maxLength);

  const start = Math.max(0, index - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);
  let snippet = text.slice(start, end).replace(/\r?\n+/g, ' ');

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Trích xuất toàn bộ nội dung văn bản tìm kiếm được từ StoredFile
 */
export async function getFileSearchableText(file: StoredFile): Promise<string> {
  const ext = (file.extension || '').toLowerCase();

  // 1. File Word (.docx)
  if (ext === 'docx') {
    try {
      const buffer = dataUrlToArrayBuffer(file.data);
      if (buffer.byteLength > 0) {
        const doc = await readDocxFromBuffer(buffer);
        return doc.rawText;
      }
    } catch {
      return '';
    }
  }

  // 2. Jupyter Notebook (.ipynb)
  if (ext === 'ipynb') {
    try {
      const raw = decodeStoredFileData(file);
      const parsed = JSON.parse(raw);
      if (parsed.cells && Array.isArray(parsed.cells)) {
        return parsed.cells
          .map((c: { source: string[] | string }) =>
            Array.isArray(c.source) ? c.source.join('') : c.source || ''
          )
          .join('\n');
      }
    } catch {
      return decodeStoredFileData(file);
    }
  }

  // 3. File Text, Code, Markdown, JSON, SQL...
  return decodeStoredFileData(file);
}

/**
 * Tìm kiếm toàn văn (Full-Text) xuyên suốt toàn bộ Cây tài liệu IndexedDB
 */
export async function searchVaultFullText(
  tree: TreeData,
  query: string
): Promise<VaultSearchResult[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const results: VaultSearchResult[] = [];

  for (const group of tree.groups) {
    for (const subject of group.subjects) {
      for (const week of subject.weeks) {
        for (const file of week.files) {
          const lowerName = file.name.toLowerCase();

          // 1. Kiểm tra khớp tên file
          if (lowerName.includes(cleanQuery)) {
            results.push({
              file,
              weekId: week.id,
              weekTitle: week.title,
              subjectId: subject.id,
              subjectName: subject.name,
              groupId: group.id,
              groupName: group.name,
              matchType: 'filename',
              matchSnippet: `Khớp tên tập tin: "${file.name}"`,
            });
            continue;
          }

          // 2. Kiểm tra khớp trong Bút nhớ dòng (highlights)
          if (file.highlights && file.highlights.length > 0) {
            const matchedHighlight = file.highlights.find((h) =>
              h.text.toLowerCase().includes(cleanQuery)
            );
            if (matchedHighlight) {
              results.push({
                file,
                weekId: week.id,
                weekTitle: week.title,
                subjectId: subject.id,
                subjectName: subject.name,
                groupId: group.id,
                groupName: group.name,
                matchType: 'highlight',
                matchSnippet: extractSnippetAroundKeyword(matchedHighlight.text, cleanQuery),
              });
              continue;
            }
          }

          // 3. Kiểm tra khớp toàn văn bên trong nội dung file
          const content = await getFileSearchableText(file);
          if (content && content.toLowerCase().includes(cleanQuery)) {
            // Tìm số dòng
            const lines = content.split('\n');
            let matchedLineIndex: number | undefined;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(cleanQuery)) {
                matchedLineIndex = i + 1;
                break;
              }
            }

            results.push({
              file,
              weekId: week.id,
              weekTitle: week.title,
              subjectId: subject.id,
              subjectName: subject.name,
              groupId: group.id,
              groupName: group.name,
              matchType: 'content',
              matchSnippet: extractSnippetAroundKeyword(content, cleanQuery),
              lineIndex: matchedLineIndex,
            });
          }
        }
      }
    }
  }

  return results;
}
