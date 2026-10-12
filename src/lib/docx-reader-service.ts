/**
 * Trình đọc và trích xuất tài liệu Word (.docx) thuần Client-side
 * Chuẩn Open Packaging Conventions (OPC) & WordprocessingML (ISO/IEC 29500)
 * Hoạt động 100% Offline, không phụ thuộc thư viện nặng ngoài
 */

export interface DocxBlock {
  type: 'paragraph' | 'heading' | 'bullet' | 'table';
  text: string;
  level?: number; // Heading level: 1, 2, 3
  tableRows?: string[][];
}

export interface DocxDocument {
  blocks: DocxBlock[];
  rawText: string;
  paragraphsCount: number;
  wordsCount: number;
}

/**
 * Trích xuất mảng byte của entry cụ thể trong file ZIP (như 'word/document.xml')
 * Sử dụng Central Directory để định vị chuẩn xác 100%
 */
export async function extractZipEntry(
  buffer: ArrayBuffer,
  targetFileName: string
): Promise<Uint8Array | null> {
  const bytes = new Uint8Array(buffer);
  const dataView = new DataView(buffer);

  // 1. Tìm End of Central Directory Record (EOCD: 0x06054b50 - PK\x05\x06)
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  // 2. Duyệt qua Central Directory entries
  if (eocdOffset !== -1) {
    const cdOffset = dataView.getUint32(eocdOffset + 16, true);
    const totalEntries = dataView.getUint16(eocdOffset + 10, true);

    let currentOffset = cdOffset;
    for (let e = 0; e < totalEntries && currentOffset < eocdOffset; e++) {
      if (
        dataView.getUint32(currentOffset, true) !== 0x02014b50 // PK\x01\x02
      ) {
        break;
      }

      const compressionMethod = dataView.getUint16(currentOffset + 10, true);
      const compressedSize = dataView.getUint32(currentOffset + 20, true);
      const uncompressedSize = dataView.getUint32(currentOffset + 24, true);
      const fileNameLen = dataView.getUint16(currentOffset + 28, true);
      const extraLen = dataView.getUint16(currentOffset + 30, true);
      const commentLen = dataView.getUint16(currentOffset + 32, true);
      const localHeaderOffset = dataView.getUint32(currentOffset + 42, true);

      const fileNameBytes = bytes.subarray(
        currentOffset + 46,
        currentOffset + 46 + fileNameLen
      );
      const entryName = new TextDecoder('utf-8').decode(fileNameBytes);

      if (entryName.toLowerCase() === targetFileName.toLowerCase()) {
        // Đọc từ Local File Header
        if (dataView.getUint32(localHeaderOffset, true) === 0x04034b50) {
          const localFileNameLen = dataView.getUint16(localHeaderOffset + 26, true);
          const localExtraLen = dataView.getUint16(localHeaderOffset + 28, true);
          const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
          const compressedData = bytes.subarray(dataStart, dataStart + compressedSize);

          if (compressionMethod === 0) {
            // Không nén (Stored)
            return compressedData;
          } else if (compressionMethod === 8) {
            // Deflate nén
            return await decompressDeflate(compressedData, uncompressedSize);
          }
        }
      }

      currentOffset += 46 + fileNameLen + extraLen + commentLen;
    }
  }

  // Fallback: Tìm quét trực tiếp Local File Headers (PK\x03\x04: 0x04034b50)
  for (let i = 0; i < bytes.length - 30; i++) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x03 &&
      bytes[i + 3] === 0x04
    ) {
      const compressionMethod = dataView.getUint16(i + 8, true);
      const compressedSize = dataView.getUint32(i + 18, true);
      const uncompressedSize = dataView.getUint32(i + 22, true);
      const fileNameLen = dataView.getUint16(i + 26, true);
      const extraLen = dataView.getUint16(i + 28, true);

      const nameSub = bytes.subarray(i + 30, i + 30 + fileNameLen);
      const entryName = new TextDecoder('utf-8').decode(nameSub);

      if (entryName.toLowerCase() === targetFileName.toLowerCase() && compressedSize > 0) {
        const dataStart = i + 30 + fileNameLen + extraLen;
        const compressedData = bytes.subarray(dataStart, dataStart + compressedSize);
        if (compressionMethod === 0) {
          return compressedData;
        } else if (compressionMethod === 8) {
          return await decompressDeflate(compressedData, uncompressedSize);
        }
      }
    }
  }

  return null;
}

/**
 * Giải nén Deflate tương thích cả Browser (DecompressionStream) và Node/Vitest
 */
async function decompressDeflate(
  compressedData: Uint8Array,
  _expectedSize?: number
): Promise<Uint8Array> {
  // 1. Kiểm tra DecompressionStream (Web API chuẩn trong Chrome, Safari, Edge, Firefox)
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      await (writer as any).write(compressedData);
      await writer.close();
      const res = await new Response(ds.readable).arrayBuffer();
      return new Uint8Array(res);
    } catch {
      // Có thể zlib stream có header, thử tiếp deflate chuẩn
      try {
        const ds2 = new DecompressionStream('deflate');
        const writer2 = ds2.writable.getWriter();
        await (writer2 as any).write(compressedData);
        await writer2.close();
        const res2 = await new Response(ds2.readable).arrayBuffer();
        return new Uint8Array(res2);
      } catch (e) {
        console.warn('DecompressionStream failed:', e);
      }
    }
  }

  // 2. Fallback cho môi trường Node.js (Vitest)
  const g = globalThis as any;
  if (g.process && g.process.versions && g.process.versions.node) {
    try {
      // Import động an toàn không gây lỗi typescript trình duyệt
      const zlibModule = await (new Function('return import("node:zlib")')());
      const buf = g.Buffer ? g.Buffer.from(compressedData) : compressedData;
      try {
        const unzipped = zlibModule.inflateRawSync(buf);
        return new Uint8Array(unzipped);
      } catch {
        const unzipped = zlibModule.inflateSync(buf);
        return new Uint8Array(unzipped);
      }
    } catch (e) {
      console.warn('Node zlib fallback failed:', e);
    }
  }

  return new Uint8Array(0);
}

/**
 * Phân tích nội dung XML của document.xml thành tài liệu có cấu trúc
 */
export function parseWordDocumentXml(xmlString: string): DocxDocument {
  const blocks: DocxBlock[] = [];
  const fullTextParts: string[] = [];

  if (!xmlString || !xmlString.trim()) {
    return { blocks: [], rawText: '', paragraphsCount: 0, wordsCount: 0 };
  }

  // Dùng DOMParser nếu có, hoặc Regex fallback nếu môi trường nhẹ
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'application/xml');

      // Duyệt qua tất cả con của w:body
      const body = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
      const children = Array.from(body.children);

      for (const node of children) {
        const nodeName = node.nodeName.toLowerCase();

        // Đoạn văn hoặc Tiêu đề (<w:p>)
        if (nodeName.endsWith(':p') || nodeName === 'p') {
          // Kiểm tra style xem có phải heading
          const pStyle = node.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
          let level: number | undefined = undefined;
          let isHeading = false;

          if (/heading\s*1|title/i.test(pStyle)) {
            level = 1;
            isHeading = true;
          } else if (/heading\s*2/i.test(pStyle)) {
            level = 2;
            isHeading = true;
          } else if (/heading\s*3/i.test(pStyle)) {
            level = 3;
            isHeading = true;
          }

          // Lấy tất cả text con <w:t>
          const textNodes = node.getElementsByTagName('w:t');
          let pText = '';
          for (let i = 0; i < textNodes.length; i++) {
            pText += textNodes[i].textContent || '';
          }

          const trimmed = pText.trim();
          if (trimmed) {
            fullTextParts.push(trimmed);

            // Kiểm tra list bullet
            const numPr = node.getElementsByTagName('w:numPr')[0];
            const isBullet = Boolean(numPr);

            blocks.push({
              type: isHeading ? 'heading' : isBullet ? 'bullet' : 'paragraph',
              text: trimmed,
              level,
            });
          }
        }
        // Bảng dữ liệu (<w:tbl>)
        else if (nodeName.endsWith(':tbl') || nodeName === 'tbl') {
          const rows = Array.from(node.getElementsByTagName('w:tr'));
          const tableData: string[][] = [];

          for (const row of rows) {
            const cells = Array.from(row.getElementsByTagName('w:tc'));
            const rowData: string[] = [];
            for (const cell of cells) {
              const cTextNodes = cell.getElementsByTagName('w:t');
              let cellText = '';
              for (let i = 0; i < cTextNodes.length; i++) {
                cellText += cTextNodes[i].textContent || '';
              }
              rowData.push(cellText.trim());
            }
            if (rowData.some((c) => c.length > 0)) {
              tableData.push(rowData);
            }
          }

          if (tableData.length > 0) {
            const tblText = tableData.map((r) => r.join(' | ')).join('\n');
            fullTextParts.push(tblText);
            blocks.push({
              type: 'table',
              text: tblText,
              tableRows: tableData,
            });
          }
        }
      }
    } catch (e) {
      console.warn('DOMParser failed, using regex fallback:', e);
    }
  }

  // Regex fallback nếu không có DOMParser hoặc DOMParser không tìm thấy blocks
  if (blocks.length === 0) {
    // 1. Phân tích các khối <w:p> hoặc <w:tbl> theo thứ tự xuất hiện
    const blockRegex = /<(w:p|w:tbl)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(xmlString)) !== null) {
      const tag = match[1];
      const content = match[2];

      if (tag === 'w:p') {
        let level: number | undefined = undefined;
        let isHeading = false;
        const styleMatch = /<w:pStyle[^>]*w:val="([^"]+)"/i.exec(content);
        if (styleMatch) {
          const val = styleMatch[1];
          if (/heading\s*1|title/i.test(val)) {
            level = 1;
            isHeading = true;
          } else if (/heading\s*2/i.test(val)) {
            level = 2;
            isHeading = true;
          } else if (/heading\s*3/i.test(val)) {
            level = 3;
            isHeading = true;
          }
        }

        const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/gi;
        let text = '';
        let tMatch: RegExpExecArray | null;
        while ((tMatch = tRegex.exec(content)) !== null) {
          text += tMatch[1];
        }
        const trimmed = text.trim();
        if (trimmed) {
          fullTextParts.push(trimmed);
          blocks.push({
            type: isHeading ? 'heading' : 'paragraph',
            text: trimmed,
            level,
          });
        }
      } else if (tag === 'w:tbl') {
        const trRegex = /<w:tr[^>]*>([\s\S]*?)<\/w:tr>/gi;
        const tableData: string[][] = [];
        let trMatch: RegExpExecArray | null;

        while ((trMatch = trRegex.exec(content)) !== null) {
          const trContent = trMatch[1];
          const tcRegex = /<w:tc[^>]*>([\s\S]*?)<\/w:tc>/gi;
          const rowData: string[] = [];
          let tcMatch: RegExpExecArray | null;

          while ((tcMatch = tcRegex.exec(trContent)) !== null) {
            const tcContent = tcMatch[1];
            const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/gi;
            let cText = '';
            let tMatch: RegExpExecArray | null;
            while ((tMatch = tRegex.exec(tcContent)) !== null) {
              cText += tMatch[1];
            }
            rowData.push(cText.trim());
          }
          if (rowData.length > 0) {
            tableData.push(rowData);
          }
        }

        if (tableData.length > 0) {
          const tblText = tableData.map((r) => r.join(' | ')).join('\n');
          fullTextParts.push(tblText);
          blocks.push({
            type: 'table',
            text: tblText,
            tableRows: tableData,
          });
        }
      }
    }
  }

  const rawText = fullTextParts.join('\n\n');
  const wordsCount = rawText.split(/\s+/).filter(Boolean).length;

  return {
    blocks,
    rawText,
    paragraphsCount: blocks.length,
    wordsCount,
  };
}

/**
 * Đọc file .docx trực tiếp từ ArrayBuffer và trả về DocxDocument
 */
export async function readDocxFromBuffer(buffer: ArrayBuffer): Promise<DocxDocument> {
  try {
    const xmlBytes = await extractZipEntry(buffer, 'word/document.xml');
    if (!xmlBytes || xmlBytes.length === 0) {
      return {
        blocks: [],
        rawText: 'Không tìm thấy nội dung văn bản word/document.xml trong tệp Word này.',
        paragraphsCount: 0,
        wordsCount: 0,
      };
    }

    const xmlString = new TextDecoder('utf-8').decode(xmlBytes);
    return parseWordDocumentXml(xmlString);
  } catch (err) {
    console.error('Lỗi khi đọc file .docx:', err);
    return {
      blocks: [],
      rawText: 'Lỗi khi trích xuất tài liệu Word: ' + String(err),
      paragraphsCount: 0,
      wordsCount: 0,
    };
  }
}
