import { MindMap, MindMapNode } from './mindmap-types';

export const NODE_CONFIG = {
  WIDTH: 180,
  HEIGHT: 48,
  HORIZ_SPACING: 120, // Khoảng cách ngang giữa các cấp
  VERT_SPACING: 32,   // Khoảng cách dọc tối thiểu giữa các node anh em
};

/**
 * Kiểm tra xem có tạo thành chu trình (Cycle) nếu nối fromNode -> toNode hay không
 */
export function wouldCauseCycle(
  nodes: Record<string, MindMapNode>,
  fromNodeId: string,
  toNodeId: string
): boolean {
  if (fromNodeId === toNodeId) return true;

  // Duyệt đệ quy từ toNodeId đi xuống xem có gặp fromNodeId không
  const visited = new Set<string>();
  const queue = [toNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === fromNodeId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = nodes[current];
    if (node && node.children) {
      for (const childId of node.children) {
        queue.push(childId);
      }
    }
  }

  return false;
}

/**
 * Tính toán chiều cao không gian cây con của một node (để xếp thẳng hàng và tránh đè node)
 */
function calculateSubtreeHeight(
  nodeId: string,
  nodes: Record<string, MindMapNode>,
  memo: Map<string, number>
): number {
  if (memo.has(nodeId)) return memo.get(nodeId)!;

  const node = nodes[nodeId];
  if (!node || node.collapsed || !node.children || node.children.length === 0) {
    const h = NODE_CONFIG.HEIGHT + NODE_CONFIG.VERT_SPACING;
    memo.set(nodeId, h);
    return h;
  }

  let totalHeight = 0;
  for (const childId of node.children) {
    totalHeight += calculateSubtreeHeight(childId, nodes, memo);
  }

  const result = Math.max(NODE_CONFIG.HEIGHT + NODE_CONFIG.VERT_SPACING, totalHeight);
  memo.set(nodeId, result);
  return result;
}

/**
 * Bố trí tự động layout cho cây sơ đồ tư duy (Auto Layout Tree Algorithm)
 * Chế độ 'radial' tỏa đều 2 bên Trái / Phải từ Nút gốc
 * Chế độ 'horizontal' tỏa sang bên Phải
 */
export function calculateAutoLayout(map: MindMap): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {};
  const root = map.nodes[map.rootNodeId];
  if (!root) return result;

  // Nút gốc đặt tại (0, 0)
  result[root.id] = { x: 0, y: 0 };

  const heightMemo = new Map<string, number>();

  if (map.layoutMode === 'radial') {
    // Chia đôi các nhánh con cấp 1: Nửa sang phải (Right), Nửa sang trái (Left)
    const children = root.children || [];
    const mid = Math.ceil(children.length / 2);
    const rightChildren = children.slice(0, mid);
    const leftChildren = children.slice(mid);

    // Bố trí nhánh bên phải (dx > 0)
    layoutBranch(rightChildren, 0, 0, 1, map.nodes, heightMemo, result);
    // Bố trí nhánh bên trái (dx < 0)
    layoutBranch(leftChildren, 0, 0, -1, map.nodes, heightMemo, result);
  } else {
    // Toàn bộ nhánh tỏa sang bên phải
    layoutBranch(root.children || [], 0, 0, 1, map.nodes, heightMemo, result);
  }

  return result;
}

/**
 * Hàm đệ quy bố trí các nhánh con theo hướng direction (1: sang phải, -1: sang trái)
 */
function layoutBranch(
  childIds: string[],
  parentX: number,
  parentY: number,
  direction: 1 | -1,
  nodes: Record<string, MindMapNode>,
  memo: Map<string, number>,
  result: Record<string, { x: number; y: number }>
): void {
  if (!childIds || childIds.length === 0) return;

  // Tính tổng chiều cao của toàn bộ nhóm anh em
  const totalHeight = childIds.reduce(
    (acc, id) => acc + calculateSubtreeHeight(id, nodes, memo),
    0
  );

  let currentY = parentY - totalHeight / 2;

  for (const childId of childIds) {
    const child = nodes[childId];
    if (!child) continue;

    const childSubtreeHeight = calculateSubtreeHeight(childId, nodes, memo);
    // Đặt node con ở chính giữa vùng không gian của cây con nó
    const childY = currentY + childSubtreeHeight / 2;
    const childX = parentX + direction * (NODE_CONFIG.WIDTH + NODE_CONFIG.HORIZ_SPACING);

    result[childId] = { x: childX, y: childY };

    // Đệ quy tiếp cho các node cháu nếu node con không bị thu gọn
    if (!child.collapsed && child.children && child.children.length > 0) {
      layoutBranch(child.children, childX, childY, direction, nodes, memo, result);
    }

    currentY += childSubtreeHeight;
  }
}

/**
 * Sinh đường cong Bézier mượt mà nối giữa 2 Node
 */
export function generateCurvedPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  isLeftToRight: boolean = true
): string {
  // Điểm xuất phát (cạnh của node nguồn)
  const startX = isLeftToRight ? fromX + NODE_CONFIG.WIDTH / 2 : fromX - NODE_CONFIG.WIDTH / 2;
  const startY = fromY;

  // Điểm đích (cạnh của node đích)
  const endX = isLeftToRight ? toX - NODE_CONFIG.WIDTH / 2 : toX + NODE_CONFIG.WIDTH / 2;
  const endY = toY;

  // Điểm điều khiển Bézier Control Points
  const dx = endX - startX;
  const cp1X = startX + dx * 0.5;
  const cp1Y = startY;
  const cp2X = startX + dx * 0.5;
  const cp2Y = endY;

  return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
}

/**
 * Tính toán Bounding Box của toàn bộ các Node trong sơ đồ (dùng để căn giữa màn hình)
 */
export function calculateBoundingBox(
  positions: Record<string, { x: number; y: number }>,
  _nodes?: Record<string, MindMapNode>
): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const nodeIds = Object.keys(positions);
  if (nodeIds.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  for (const id of nodeIds) {
    const pos = positions[id];
    if (!pos) continue;
    const halfW = NODE_CONFIG.WIDTH / 2;
    const halfH = NODE_CONFIG.HEIGHT / 2;

    minX = Math.min(minX, pos.x - halfW);
    maxX = Math.max(maxX, pos.x + halfW);
    minY = Math.min(minY, pos.y - halfH);
    maxY = Math.max(maxY, pos.y + halfH);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
