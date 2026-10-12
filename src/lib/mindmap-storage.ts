import { MindMap, MindMapNode } from './mindmap-types';
import { Category } from './types';
import { CornellNote } from './cornell-types';

const STORAGE_KEY = 'atomic_mindmaps_data';

// Dữ liệu mẫu khởi tạo khi người dùng lần đầu mở tính năng
const INITIAL_MINDMAPS: MindMap[] = [
  {
    id: 'mindmap-sample-1',
    title: 'Hệ Thống Học Tập Nguyên Tử (Atomic Learning System)',
    description: 'Tổng quan các phương pháp học tập đỉnh cao và chu trình Spaced Repetition',
    category: 'code',
    rootNodeId: 'root-1',
    layoutMode: 'radial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: {
      'root-1': {
        id: 'root-1',
        label: 'Atomic Learning',
        detail: 'Phương pháp học tập khoa học cá nhân hóa',
        color: 'indigo',
        x: 0,
        y: 0,
        isRoot: true,
        children: ['branch-srs', 'branch-feynman', 'branch-cornell', 'branch-focus'],
        parentId: null,
      },
      'branch-srs': {
        id: 'branch-srs',
        label: 'Spaced Repetition (SRS)',
        detail: 'Lặp lại ngắt quãng đánh bại đường cong lãng quên Ebbinghaus',
        color: 'sky',
        x: 300,
        y: -100,
        children: ['srs-1', 'srs-2'],
        parentId: 'root-1',
      },
      'srs-1': {
        id: 'srs-1',
        label: 'Active Recall',
        detail: 'Kích hoạt trí nhớ chủ động bằng Flashcards 2 mặt',
        color: 'sky',
        x: 600,
        y: -140,
        children: [],
        parentId: 'branch-srs',
      },
      'srs-2': {
        id: 'srs-2',
        label: 'Thuật toán SM-2 / FSRS',
        detail: 'Tính toán chu kỳ ôn tập tự động theo mức độ ghi nhớ',
        color: 'sky',
        x: 600,
        y: -60,
        children: [],
        parentId: 'branch-srs',
      },
      'branch-feynman': {
        id: 'branch-feynman',
        label: 'Kỹ Thuật Feynman',
        detail: 'Giảng giải bản chất như cho đứa trẻ 12 tuổi',
        color: 'purple',
        x: 300,
        y: 100,
        children: ['feynman-1', 'feynman-2'],
        parentId: 'root-1',
      },
      'feynman-1': {
        id: 'feynman-1',
        label: 'Loại bỏ Jargon',
        detail: 'Phát hiện thuật ngữ đao to búa lớn dùng để né tránh bản chất',
        color: 'purple',
        x: 600,
        y: 60,
        children: [],
        parentId: 'branch-feynman',
      },
      'feynman-2': {
        id: 'feynman-2',
        label: 'Phép Ẩn Dụ Đời Thường',
        detail: 'Liên tưởng khái niệm với đời sống hàng ngày',
        color: 'purple',
        x: 600,
        y: 140,
        children: [],
        parentId: 'branch-feynman',
      },
      'branch-cornell': {
        id: 'branch-cornell',
        label: 'Ghi Chú Cornell (3 Vùng)',
        detail: 'Hệ thống ghi chép ghi nhận và tổng hợp thông minh',
        color: 'amber',
        x: -300,
        y: -80,
        children: ['cornell-1', 'cornell-2'],
        parentId: 'root-1',
      },
      'cornell-1': {
        id: 'cornell-1',
        label: 'Cues & Questions',
        detail: 'Câu hỏi gợi nhớ then chốt ở cột trái',
        color: 'amber',
        x: -600,
        y: -120,
        children: [],
        parentId: 'branch-cornell',
      },
      'cornell-2': {
        id: 'cornell-2',
        label: 'Summary Đúc Kết',
        detail: 'Tóm tắt bài học trong 2-3 câu ngắn gọn',
        color: 'amber',
        x: -600,
        y: -40,
        children: [],
        parentId: 'branch-cornell',
      },
      'branch-focus': {
        id: 'branch-focus',
        label: 'Pomodoro & Focus Garden',
        detail: '25 phút tập trung cao độ và nuôi dưỡng khu vườn tri thức',
        color: 'emerald',
        x: -300,
        y: 80,
        children: ['focus-1', 'focus-2'],
        parentId: 'root-1',
      },
      'focus-1': {
        id: 'focus-1',
        label: 'Sóng Não Alpha/Gamma',
        detail: 'Âm thanh sóng não ngoại tuyến tăng khả năng tiếp thu',
        color: 'emerald',
        x: -600,
        y: 40,
        children: [],
        parentId: 'branch-focus',
      },
      'focus-2': {
        id: 'focus-2',
        label: 'Thu Hoạch Cây Sồi',
        detail: 'Biến nỗ lực học tập thành phần thưởng trực quan',
        color: 'emerald',
        x: -600,
        y: 120,
        children: [],
        parentId: 'branch-focus',
      },
    },
    edges: [],
  },
];

/**
 * Lấy danh sách toàn bộ các bản đồ tư duy
 */
export function getMindMaps(): MindMap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      saveAllMindMaps(INITIAL_MINDMAPS);
      return INITIAL_MINDMAPS;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Lỗi khi đọc Mindmaps từ LocalStorage:', e);
    return [];
  }
}

/**
 * Lưu toàn bộ danh sách Mindmaps
 */
function saveAllMindMaps(maps: MindMap[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  } catch (e) {
    console.error('Lỗi khi lưu Mindmaps vào LocalStorage:', e);
  }
}

/**
 * Lấy một bản đồ theo ID
 */
export function getMindMapById(id: string): MindMap | null {
  const list = getMindMaps();
  return list.find((m) => m.id === id) || null;
}

/**
 * Lưu cập nhật một bản đồ
 */
export function saveMindMap(map: MindMap): void {
  const list = getMindMaps();
  const index = list.findIndex((m) => m.id === map.id);
  const updated = {
    ...map,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    list[index] = updated;
  } else {
    list.unshift(updated);
  }
  saveAllMindMaps(list);
}

/**
 * Tạo một bản đồ tư duy mới
 */
export function createMindMap(
  title: string,
  category: Category = 'code',
  description?: string,
  layoutMode: 'horizontal' | 'radial' = 'radial'
): MindMap {
  const rootId = `root-${Date.now()}`;
  const newMap: MindMap = {
    id: `mindmap-${Date.now()}`,
    title: title.trim() || 'Sơ đồ tư duy mới',
    description: description?.trim() || '',
    category,
    rootNodeId: rootId,
    layoutMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: {
      [rootId]: {
        id: rootId,
        label: title.trim() || 'Chủ đề trung tâm',
        detail: 'Nhấp đúp chuột để chỉnh sửa',
        color: 'indigo',
        x: 0,
        y: 0,
        isRoot: true,
        children: [],
        parentId: null,
      },
    },
    edges: [],
  };

  saveMindMap(newMap);
  return newMap;
}

/**
 * Xóa một bản đồ tư duy
 */
export function deleteMindMap(id: string): void {
  const list = getMindMaps();
  const filtered = list.filter((m) => m.id !== id);
  saveAllMindMaps(filtered);
}

/**
 * Thêm một node con vào node cha
 */
export function addNodeToMindMap(
  map: MindMap,
  parentId: string,
  label: string,
  detail?: string,
  color?: string
): MindMap {
  const parent = map.nodes[parentId];
  if (!parent) return map;

  const childId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Tự động kế thừa màu từ cha nếu không chỉ định
  const nodeColor = color || parent.color || 'sky';

  const newNode: MindMapNode = {
    id: childId,
    label: label.trim() || 'Nhánh mới',
    detail: detail?.trim() || '',
    color: nodeColor,
    x: parent.x + 250,
    y: parent.y,
    children: [],
    parentId,
  };

  const updatedNodes = {
    ...map.nodes,
    [childId]: newNode,
    [parentId]: {
      ...parent,
      collapsed: false, // Mở rộng node cha khi thêm con
      children: [...(parent.children || []), childId],
    },
  };

  const updatedMap: MindMap = {
    ...map,
    nodes: updatedNodes,
    updatedAt: new Date().toISOString(),
  };

  saveMindMap(updatedMap);
  return updatedMap;
}

/**
 * Cập nhật thông tin của một Node
 */
export function updateNodeInMindMap(
  map: MindMap,
  nodeId: string,
  updates: Partial<MindMapNode>
): MindMap {
  const target = map.nodes[nodeId];
  if (!target) return map;

  const updatedNodes = {
    ...map.nodes,
    [nodeId]: {
      ...target,
      ...updates,
    },
  };

  const updatedMap: MindMap = {
    ...map,
    nodes: updatedNodes,
    updatedAt: new Date().toISOString(),
  };

  saveMindMap(updatedMap);
  return updatedMap;
}

/**
 * Xóa một Node (và xóa đệ quy toàn bộ các node con của nó)
 */
export function deleteNodeFromMindMap(map: MindMap, nodeId: string): MindMap {
  if (nodeId === map.rootNodeId) return map; // Không cho phép xóa Root Node

  const target = map.nodes[nodeId];
  if (!target) return map;

  // Thu thập toàn bộ ID các node con cần xóa
  const toDelete = new Set<string>();
  const collectChildren = (id: string) => {
    toDelete.add(id);
    const n = map.nodes[id];
    if (n && n.children) {
      n.children.forEach(collectChildren);
    }
  };
  collectChildren(nodeId);

  // Tạo bản sao nodes loại bỏ các node đã xóa
  const newNodes = { ...map.nodes };
  toDelete.forEach((id) => delete newNodes[id]);

  // Cập nhật danh sách children của node cha
  if (target.parentId && newNodes[target.parentId]) {
    newNodes[target.parentId] = {
      ...newNodes[target.parentId],
      children: newNodes[target.parentId].children.filter((cid) => cid !== nodeId),
    };
  }

  // Xóa các cạnh liên kết liên quan
  const newEdges = map.edges.filter(
    (e) => !toDelete.has(e.fromNodeId) && !toDelete.has(e.toNodeId)
  );

  const updatedMap: MindMap = {
    ...map,
    nodes: newNodes,
    edges: newEdges,
    updatedAt: new Date().toISOString(),
  };

  saveMindMap(updatedMap);
  return updatedMap;
}

/**
 * Thu gọn / Mở rộng các nhánh con của một Node
 */
export function toggleNodeCollapse(map: MindMap, nodeId: string): MindMap {
  const target = map.nodes[nodeId];
  if (!target || !target.children || target.children.length === 0) return map;

  return updateNodeInMindMap(map, nodeId, {
    collapsed: !target.collapsed,
  });
}

/**
 * Tự động chuyển đổi Ghi chú Cornell thành Sơ đồ tư duy trực quan
 */
export function convertCornellNoteToMindMap(note: CornellNote): MindMap {
  const rootId = `root-${Date.now()}`;
  const mapId = `mindmap-cornell-${Date.now()}`;

  const nodes: Record<string, MindMapNode> = {
    [rootId]: {
      id: rootId,
      label: note.title,
      detail: note.summary || 'Trích xuất từ Ghi chú Cornell',
      color: 'indigo',
      x: 0,
      y: 0,
      isRoot: true,
      children: [],
      parentId: null,
    },
  };

  // Thêm nhánh Cues
  const cuesBranchId = `branch-cues-${Date.now()}`;
  nodes[cuesBranchId] = {
    id: cuesBranchId,
    label: 'Câu hỏi gợi nhớ (Cues)',
    detail: `Gồm ${note.cues.length} câu hỏi trọng tâm`,
    color: 'sky',
    x: 280,
    y: -80,
    children: [],
    parentId: rootId,
  };

  note.cues.forEach((c, idx) => {
    const cueNodeId = `cue-${idx}-${Date.now()}`;
    nodes[cueNodeId] = {
      id: cueNodeId,
      label: c.cue,
      detail: c.referenceAnswer || '',
      color: 'sky',
      x: 560,
      y: -140 + idx * 60,
      children: [],
      parentId: cuesBranchId,
    };
    nodes[cuesBranchId].children.push(cueNodeId);
  });

  // Thêm nhánh Summary
  if (note.summary) {
    const summaryBranchId = `branch-summary-${Date.now()}`;
    nodes[summaryBranchId] = {
      id: summaryBranchId,
      label: 'Đúc kết cốt lõi (Summary)',
      detail: note.summary,
      color: 'amber',
      x: 280,
      y: 100,
      children: [],
      parentId: rootId,
    };
    nodes[rootId].children.push(summaryBranchId);
  }

  nodes[rootId].children.unshift(cuesBranchId);

  const newMap: MindMap = {
    id: mapId,
    title: `Sơ đồ: ${note.title}`,
    description: `Sinh tự động từ Ghi chú Cornell [${note.category.toUpperCase()}]`,
    category: note.category,
    rootNodeId: rootId,
    nodes,
    edges: [],
    layoutMode: 'horizontal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveMindMap(newMap);
  return newMap;
}

/**
 * Xuất Sơ đồ tư duy thành định dạng Markdown Outline phân cấp
 */
export function exportMindMapToMarkdown(map: MindMap): string {
  const root = map.nodes[map.rootNodeId];
  if (!root) return '';

  const lines: string[] = [`# ${root.label}`];
  if (root.detail) lines.push(`> ${root.detail}\n`);

  const printNode = (id: string, depth: number) => {
    const node = map.nodes[id];
    if (!node) return;
    const indent = '  '.repeat(depth);
    lines.push(`${indent}- **${node.label}**${node.detail ? `: ${node.detail}` : ''}`);
    if (node.children && node.children.length > 0) {
      node.children.forEach((cid) => printNode(cid, depth + 1));
    }
  };

  root.children.forEach((cid) => printNode(cid, 0));
  return lines.join('\n');
}
