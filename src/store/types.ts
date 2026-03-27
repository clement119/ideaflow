export type NodeType = 'default' | 'idea' | 'note';
export type EdgeStyle = 'solid' | 'dashed';

export type CursorMode =
  | 'idle'
  | 'hover-node'
  | 'drag-node'
  | 'hover-handle'
  | 'draw-edge'
  | 'hover-cluster'
  | 'text-edit'
  | 'pan-idle'
  | 'pan-drag'
  | 'delete-ready';

export interface INode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colour: string;
  emoji?: string;
  note?: string;
  noteVisible?: boolean;
}

export interface IEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  style: EdgeStyle;
  note?: string;
  noteVisible?: boolean;
}

export interface ICluster {
  id: string;
  label: string;
  colour: string;
  memberNodeIds: string[];
  isCollapsed: boolean;
  x: number;
  y: number;
}

export interface CanvasTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface HintsState {
  shown: string[];
  interactionCount: number;
}

export interface SelectionState {
  nodeIds: string[];
  edgeIds: string[];
  clusterId: string | null;
}
