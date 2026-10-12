import { describe, it, expect } from 'vitest';
import { decodeStoredFileData, formatFileSize, dataUrlToArrayBuffer } from '../lib/file-utils';
import { parseWordDocumentXml } from '../lib/docx-reader-service';
import { StoredFile } from '../lib/tree-types';

describe('File Utilities & Decoders', () => {
  it('giải mã chính xác data URL text/plain utf-8', () => {
    const raw = 'Xin chào thế giới! # Lập trình';
    const file: StoredFile = {
      id: 'f1',
      name: 'hello.txt',
      extension: 'txt',
      size: 100,
      mimeType: 'text/plain',
      createdAt: new Date().toISOString(),
      data: 'data:text/plain;charset=utf-8,' + encodeURIComponent(raw),
    };

    expect(decodeStoredFileData(file)).toBe(raw);
  });

  it('giải mã chính xác data URL application/json utf-8', () => {
    const jsonStr = JSON.stringify({ name: 'Atomic Learn', version: 2 });
    const file: StoredFile = {
      id: 'f2',
      name: 'config.json',
      extension: 'json',
      size: 50,
      mimeType: 'application/json',
      createdAt: new Date().toISOString(),
      data: 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr),
    };

    expect(decodeStoredFileData(file)).toBe(jsonStr);
  });

  it('giải mã chính xác chuỗi base64', () => {
    const text = 'Nội dung file base64';
    const base64 = typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(text)))
      : (globalThis as any).Buffer.from(text, 'utf-8').toString('base64');
    const file: StoredFile = {
      id: 'f3',
      name: 'test.py',
      extension: 'py',
      size: 30,
      mimeType: 'text/x-python',
      createdAt: new Date().toISOString(),
      data: 'data:text/x-python;base64,' + base64,
    };

    expect(decodeStoredFileData(file)).toBe(text);
  });

  it('format dung lượng file chính xác', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.00 MB');
  });

  it('chuyển đổi dataUrl thành ArrayBuffer chuẩn xác', () => {
    const text = 'Test Buffer';
    const base64 = typeof btoa !== 'undefined'
      ? btoa(text)
      : (globalThis as any).Buffer.from(text).toString('base64');
    const buffer = dataUrlToArrayBuffer('data:application/octet-stream;base64,' + base64);
    expect(buffer.byteLength).toBe(text.length);
  });
});

describe('Native Docx Reader & XML Parser', () => {
  it('phân tích XML Word và trích xuất các đoạn văn và tiêu đề', () => {
    const xml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr>
              <w:pStyle w:val="Heading 1"/>
            </w:pPr>
            <w:t>CHƯƠNG 1: TỔNG QUAN HỆ THỐNG</w:t>
          </w:p>
          <w:p>
            <w:t>Đây là đoạn văn bản giải thích chi tiết về kiến trúc phần mềm.</w:t>
          </w:p>
          <w:tbl>
            <w:tr>
              <w:tc><w:t>Cột A</w:t></w:tc>
              <w:tc><w:t>Cột B</w:t></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:t>Giá trị 1</w:t></w:tc>
              <w:tc><w:t>Giá trị 2</w:t></w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>
    `;

    const doc = parseWordDocumentXml(xml);
    expect(doc.blocks.length).toBe(3);
    expect(doc.blocks[0].type).toBe('heading');
    expect(doc.blocks[0].level).toBe(1);
    expect(doc.blocks[0].text).toContain('CHƯƠNG 1');

    expect(doc.blocks[1].type).toBe('paragraph');
    expect(doc.blocks[1].text).toContain('kiến trúc phần mềm');

    expect(doc.blocks[2].type).toBe('table');
    expect(doc.blocks[2].tableRows?.length).toBe(2);
    expect(doc.blocks[2].tableRows?.[0]).toEqual(['Cột A', 'Cột B']);

    expect(doc.rawText).toContain('CHƯƠNG 1');
    expect(doc.wordsCount).toBeGreaterThan(5);
  });

  it('xử lý an toàn khi XML rỗng hoặc lỗi', () => {
    const doc = parseWordDocumentXml('');
    expect(doc.blocks).toEqual([]);
    expect(doc.rawText).toBe('');
    expect(doc.paragraphsCount).toBe(0);
  });
});
