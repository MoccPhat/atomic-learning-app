import { Category } from './types';

export interface MindMapNode {
  id: string;
  label: string;
  detail?: string;
  color?: string; // Tên màu: 'indigo' | 'emerald' | 'sky' | 'amber' | 'rose' | 'purple' | 'slate'
  x: number;
  y: number;
  isRoot?: boolean;
  collapsed?: boolean;
  children: string[]; // Danh sách ID các node con (đảm bảo tính thuần phân cấp)
  parentId?: string | null;
  tags?: string[];
}

export interface MindMapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  style?: 'dashed' | 'solid' | 'curved';
}

export type MindMapLayoutMode = 'horizontal' | 'radial';

export interface MindMap {
  id: string;
  title: string;
  description?: string;
  category: Category;
  rootNodeId: string;
  nodes: Record<string, MindMapNode>; // Tra cứu O(1) theo Node ID
  edges: MindMapEdge[]; // Các đường liên kết chéo (Cross-links ngoài cây phân cấp)
  layoutMode: MindMapLayoutMode;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}
