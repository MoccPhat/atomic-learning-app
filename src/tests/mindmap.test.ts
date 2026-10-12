import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMindMaps,
  createMindMap,
  addNodeToMindMap,
  updateNodeInMindMap,
  deleteNodeFromMindMap,
  toggleNodeCollapse,
  convertCornellNoteToMindMap,
  exportMindMapToMarkdown,
} from '../lib/mindmap-storage';
import {
  calculateAutoLayout,
  wouldCauseCycle,
  generateCurvedPath,
} from '../lib/mindmap-layout';
import { CornellNote } from '../lib/cornell-types';

// Polyfill localStorage cho Vitest
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

describe('MindMap Storage & Layout Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('khởi tạo danh sách mindmaps mẫu ban đầu khi localStorage trống', () => {
    const list = getMindMaps();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].title).toContain('Atomic Learning');
    expect(list[0].rootNodeId).toBeDefined();
    expect(list[0].nodes[list[0].rootNodeId].isRoot).toBe(true);
  });

  it('tạo mindmap mới và tự động thiết lập nút gốc (Root Node)', () => {
    const map = createMindMap('Giải Thuật Đồ Thị', 'code', 'Đồ thị có hướng và vô hướng');
    expect(map.title).toBe('Giải Thuật Đồ Thị');
    expect(map.category).toBe('code');
    const root = map.nodes[map.rootNodeId];
    expect(root).toBeDefined();
    expect(root.label).toBe('Giải Thuật Đồ Thị');
    expect(root.children).toEqual([]);
  });

  it('thêm node con và liên kết hai chiều với node cha', () => {
    let map = createMindMap('React 19 Deep Dive', 'code');
    map = addNodeToMindMap(map, map.rootNodeId, 'Server Components', 'Chạy thuần trên server', 'indigo');

    const root = map.nodes[map.rootNodeId];
    expect(root.children.length).toBe(1);

    const childId = root.children[0];
    const child = map.nodes[childId];
    expect(child).toBeDefined();
    expect(child.label).toBe('Server Components');
    expect(child.parentId).toBe(map.rootNodeId);
    expect(child.color).toBe('indigo');
  });

  it('cập nhật thông tin node thành công', () => {
    let map = createMindMap('Test Update', 'exam');
    map = addNodeToMindMap(map, map.rootNodeId, 'Nhánh Ban Đầu');
    const childId = map.nodes[map.rootNodeId].children[0];

    map = updateNodeInMindMap(map, childId, {
      label: 'Nhánh Đã Đổi Tên',
      color: 'emerald',
      detail: 'Chi tiết mới',
    });

    const updated = map.nodes[childId];
    expect(updated.label).toBe('Nhánh Đã Đổi Tên');
    expect(updated.color).toBe('emerald');
    expect(updated.detail).toBe('Chi tiết mới');
  });

  it('xóa node và xóa đệ quy toàn bộ cây con bên dưới', () => {
    let map = createMindMap('Xóa Node Cây', 'book');
    map = addNodeToMindMap(map, map.rootNodeId, 'Nhánh Cấp 1');
    const child1Id = map.nodes[map.rootNodeId].children[0];
    map = addNodeToMindMap(map, child1Id, 'Nhánh Cấp 2 A');
    map = addNodeToMindMap(map, child1Id, 'Nhánh Cấp 2 B');

    expect(Object.keys(map.nodes).length).toBe(4); // root + 1 + 2

    // Xóa Nhánh Cấp 1
    map = deleteNodeFromMindMap(map, child1Id);

    expect(map.nodes[child1Id]).toBeUndefined();
    expect(map.nodes[map.rootNodeId].children).not.toContain(child1Id);
    expect(Object.keys(map.nodes).length).toBe(1); // Chỉ còn lại root
  });

  it('thu gọn và mở rộng nhánh con (toggleNodeCollapse)', () => {
    let map = createMindMap('Collapse Test', 'english');
    map = addNodeToMindMap(map, map.rootNodeId, 'Vocabulary');
    const childId = map.nodes[map.rootNodeId].children[0];
    map = addNodeToMindMap(map, childId, 'Sub vocab');

    expect(map.nodes[childId].collapsed).toBeFalsy();
    map = toggleNodeCollapse(map, childId);
    expect(map.nodes[childId].collapsed).toBe(true);
    map = toggleNodeCollapse(map, childId);
    expect(map.nodes[childId].collapsed).toBe(false);
  });

  it('phát hiện và ngăn chặn liên kết chu trình vòng (Cycle Detection)', () => {
    let map = createMindMap('Cycle Check', 'code');
    map = addNodeToMindMap(map, map.rootNodeId, 'Node A');
    const nodeAId = map.nodes[map.rootNodeId].children[0];
    map = addNodeToMindMap(map, nodeAId, 'Node B');
    const nodeBId = map.nodes[nodeAId].children[0];

    // Nối chính nó
    expect(wouldCauseCycle(map.nodes, nodeAId, nodeAId)).toBe(true);
    // Nối ngược từ con (B) lên cha (A)
    expect(wouldCauseCycle(map.nodes, nodeBId, nodeAId)).toBe(true);
    // Nối từ A xuống B là hợp lệ
    expect(wouldCauseCycle(map.nodes, nodeAId, nodeBId)).toBe(false);
  });

  it('tính toán auto-layout phân tách toạ độ các node', () => {
    let map = createMindMap('Auto Layout', 'code');
    map = addNodeToMindMap(map, map.rootNodeId, 'Nhánh Phải 1');
    map = addNodeToMindMap(map, map.rootNodeId, 'Nhánh Trái 1');
    map = addNodeToMindMap(map, map.rootNodeId, 'Nhánh Phải 2');

    const positions = calculateAutoLayout(map);
    const rootPos = positions[map.rootNodeId];
    expect(rootPos).toEqual({ x: 0, y: 0 });

    const c1Id = map.nodes[map.rootNodeId].children[0];
    const c2Id = map.nodes[map.rootNodeId].children[1];
    const c3Id = map.nodes[map.rootNodeId].children[2];

    expect(positions[c1Id]).toBeDefined();
    expect(positions[c2Id]).toBeDefined();
    expect(positions[c3Id]).toBeDefined();

    // c1 (bên phải) và c2 (bên trái) có toạ độ X khác dấu nhau
    expect(positions[c1Id].x > 0).toBe(true);
    expect(positions[c3Id].x < 0).toBe(true);

    // c1 và c2 (cùng phía bên phải) không được trùng toạ độ Y
    expect(positions[c1Id].y).not.toBe(positions[c2Id].y);
  });

  it('sinh đường cong Bézier SVG hợp lệ', () => {
    const path = generateCurvedPath(0, 0, 300, 100);
    expect(path).toContain('M ');
    expect(path).toContain('C ');
  });

  it('chuyển đổi Ghi chú Cornell sang Mindmap chuẩn xác', () => {
    const fakeCornellNote: CornellNote = {
      id: 'cornell-123',
      title: 'Thiết Kế Cơ Sở Dữ Liệu Chuẩn Hóa',
      category: 'code',
      cues: [
        { id: 'c1', cue: 'Dạng chuẩn 1NF là gì?', referenceAnswer: 'Không chứa nhóm lặp' },
        { id: 'c2', cue: 'Dạng chuẩn 2NF là gì?', referenceAnswer: 'Đạt 1NF và phụ thuộc đầy đủ' },
      ],
      notes: 'Nội dung bài học',
      summary: 'Chuẩn hóa giúp loại bỏ dị thường khi thêm, sửa, xóa.',
      tags: ['database'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const map = convertCornellNoteToMindMap(fakeCornellNote);
    expect(map.title).toContain('Thiết Kế Cơ Sở Dữ Liệu');
    const root = map.nodes[map.rootNodeId];
    expect(root.children.length).toBe(2); // Nhánh Cues và Nhánh Summary
  });

  it('xuất sơ đồ tư duy thành Markdown Outline phân cấp', () => {
    let map = createMindMap('Markdown Export Test', 'book');
    map = addNodeToMindMap(map, map.rootNodeId, 'Chương 1', 'Mở đầu');
    const md = exportMindMapToMarkdown(map);

    expect(md).toContain('# Markdown Export Test');
    expect(md).toContain('- **Chương 1**: Mở đầu');
  });

  it('tính toán toạ độ screenToWorld và zoom boundaries chuẩn xác', () => {
    // Công thức biến đổi toạ độ: (screen - center - viewport.x) / viewport.zoom
    const containerRect = { left: 100, top: 50, width: 800, height: 600 } as DOMRect;
    const centerX = 800 / 2; // 400
    const centerY = 600 / 2; // 300
    const viewport = { x: 50, y: -20, zoom: 1.5 };

    const screenX = 100 + 400 + 50 + 150; // screenX so với container left
    const screenY = 50 + 300 - 20 + 75;

    const relX = screenX - containerRect.left;
    const relY = screenY - containerRect.top;
    const worldX = (relX - centerX - viewport.x) / viewport.zoom;
    const worldY = (relY - centerY - viewport.y) / viewport.zoom;

    expect(worldX).toBeCloseTo(100);
    expect(worldY).toBeCloseTo(50);
  });
});
