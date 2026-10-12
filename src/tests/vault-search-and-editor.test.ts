import { describe, it, expect } from 'vitest';
import {
  updateStoredFileContent,
  updateStoredFileHighlights,
  findFileInTree,
  createNewStoredFile,
} from '../lib/tree-storage';
import {
  searchVaultFullText,
  extractSnippetAroundKeyword,
} from '../lib/vault-search-service';
import { TreeData } from '../lib/tree-types';

describe('Tree Storage - File Content Editing & Highlights', () => {
  const sampleTree: TreeData = {
    groups: [
      {
        id: 'g-cntt',
        name: 'CNTT',
        subjects: [
          {
            id: 's-python',
            name: 'Lập trình Python',
            weeks: [
              {
                id: 'w-1',
                weekNumber: 1,
                title: 'Tuần 1: Cú pháp cơ bản',
                files: [
                  createNewStoredFile('script', 'py', 'print("Hello World")\n# ghi chú ban đầu'),
                  createNewStoredFile('notes', 'md', '# Khái niệm Biến và Kiểu dữ liệu\nPython hỗ trợ dynamic typing.'),
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  it('tìm thấy file chính xác qua findFileInTree', () => {
    const fileId = sampleTree.groups[0].subjects[0].weeks[0].files[0].id;
    const found = findFileInTree(sampleTree, fileId);
    expect(found).not.toBeNull();
    expect(found?.file.name).toBe('script.py');
    expect(found?.week.id).toBe('w-1');
    expect(found?.subject.id).toBe('s-python');
    expect(found?.group.id).toBe('g-cntt');
  });

  it('cập nhật nội dung file văn bản qua updateStoredFileContent', async () => {
    const fileId = sampleTree.groups[0].subjects[0].weeks[0].files[0].id;
    const newContent = 'def sum(a, b):\n    return a + b\n';
    const updated = await updateStoredFileContent(sampleTree, fileId, newContent);

    const found = findFileInTree(updated, fileId);
    expect(found?.file.data).toContain(encodeURIComponent(newContent));
    expect(found?.file.size).toBeGreaterThan(10);
  });

  it('lưu bút nhớ dòng (highlights) qua updateStoredFileHighlights', async () => {
    const fileId = sampleTree.groups[0].subjects[0].weeks[0].files[1].id;
    const highlights = [
      {
        id: 'hl-1',
        text: 'Python hỗ trợ dynamic typing.',
        color: 'yellow' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    const updated = await updateStoredFileHighlights(sampleTree, fileId, highlights);
    const found = findFileInTree(updated, fileId);
    expect(found?.file.highlights).toEqual(highlights);
  });
});

describe('Vault Full-Text Search Service', () => {
  const searchTree: TreeData = {
    groups: [
      {
        id: 'g-1',
        name: 'Khoa học Dữ liệu',
        subjects: [
          {
            id: 's-1',
            name: 'Máy học (Machine Learning)',
            weeks: [
              {
                id: 'w-1',
                weekNumber: 1,
                title: 'Tuần 1: Linear Regression',
                files: [
                  createNewStoredFile('gradient_descent', 'py', 'def compute_cost(X, y, theta):\n    return np.mean((X @ theta - y) ** 2)'),
                  createNewStoredFile('summary', 'md', '## Gradient Descent Optimization\nThuật toán tối ưu hóa đạo hàm từng phần để tìm cực tiểu.'),
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  it('trích xuất snippet xung quanh từ khóa', () => {
    const text = 'Hệ thống học tập Atomic Learn hỗ trợ phương pháp Spaced Repetition cực kỳ hiệu quả cho kỳ thi.';
    const snippet = extractSnippetAroundKeyword(text, 'Spaced Repetition', 40);
    expect(snippet).toContain('Spaced Repetition');
  });

  it('tìm kiếm toàn văn bên trong nội dung file code và markdown', async () => {
    const results = await searchVaultFullText(searchTree, 'compute_cost');
    expect(results.length).toBe(1);
    expect(results[0].file.name).toBe('gradient_descent.py');
    expect(results[0].matchType).toBe('content');
    expect(results[0].matchSnippet).toContain('compute_cost');

    const mdResults = await searchVaultFullText(searchTree, 'đạo hàm');
    expect(mdResults.length).toBe(1);
    expect(mdResults[0].file.name).toBe('summary.md');
    expect(mdResults[0].matchType).toBe('content');
  });

  it('tìm kiếm khớp tên file', async () => {
    const results = await searchVaultFullText(searchTree, 'gradient');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].matchType).toBe('filename');
  });

  it('trả về mảng rỗng khi query trống', async () => {
    const results = await searchVaultFullText(searchTree, '   ');
    expect(results).toEqual([]);
  });
});
