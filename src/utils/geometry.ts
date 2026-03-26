import type { INode, ICluster } from '../store/types';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Compute centroid of a set of nodes */
export function computeCentroid(nodeIds: string[], nodes: Record<string, INode>): Point {
  const pts = nodeIds.map(id => nodes[id]).filter(Boolean).map(n => ({ x: n.x + n.width / 2, y: n.y + n.height / 2 }));
  if (!pts.length) return { x: 0, y: 0 };
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
}

/** Compute bounding box of a set of nodes */
export function computeBoundingBox(nodeIds: string[], nodes: Record<string, INode>, padding = 0): Rect {
  const ns = nodeIds.map(id => nodes[id]).filter(Boolean);
  if (!ns.length) return { x: 0, y: 0, width: 0, height: 0 };
  const minX = Math.min(...ns.map(n => n.x)) - padding;
  const minY = Math.min(...ns.map(n => n.y)) - padding;
  const maxX = Math.max(...ns.map(n => n.x + n.width)) + padding;
  const maxY = Math.max(...ns.map(n => n.y + n.height)) + padding;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Get anchor points (mid-points of each side) for a node */
function getAnchors(rect: Rect): Record<'right' | 'left' | 'top' | 'bottom', Point> {
  return {
    right:  { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
    left:   { x: rect.x,              y: rect.y + rect.height / 2 },
    top:    { x: rect.x + rect.width / 2, y: rect.y },
    bottom: { x: rect.x + rect.width / 2, y: rect.y + rect.height },
  };
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface BezierResult {
  d: string;
  midpoint: Point;
  sourceAnchor: Point;
  targetAnchor: Point;
}

/** Compute a cubic bezier path between two rects, picking the nearest anchor pair */
export function routeEdge(source: Rect, target: Rect): BezierResult {
  const sa = getAnchors(source);
  const ta = getAnchors(target);
  const sides = ['right', 'left', 'top', 'bottom'] as const;

  let best = Infinity;
  let sp: Point = sa.right;
  let tp: Point = ta.left;

  for (const s of sides) {
    for (const t of sides) {
      const d = dist(sa[s], ta[t]);
      if (d < best) { best = d; sp = sa[s]; tp = ta[t]; }
    }
  }

  const dx = Math.abs(tp.x - sp.x);
  const cp1: Point = { x: sp.x + dx * 0.5, y: sp.y };
  const cp2: Point = { x: tp.x - dx * 0.5, y: tp.y };

  // Bezier midpoint at t=0.5
  const midpoint: Point = {
    x: 0.125 * sp.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * tp.x,
    y: 0.125 * sp.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * tp.y,
  };

  return {
    d: `M ${sp.x},${sp.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${tp.x},${tp.y}`,
    midpoint,
    sourceAnchor: sp,
    targetAnchor: tp,
  };
}

/** Route an edge to/from a cursor point (for draft edges) */
export function routeEdgeToCursor(source: Rect, cursor: Point): BezierResult {
  const sa = getAnchors(source);
  const sides = ['right', 'left', 'top', 'bottom'] as const;
  let best = Infinity;
  let sp: Point = sa.right;
  for (const s of sides) {
    const d = dist(sa[s], cursor);
    if (d < best) { best = d; sp = sa[s]; }
  }
  const dx = Math.abs(cursor.x - sp.x);
  const cp1: Point = { x: sp.x + dx * 0.5, y: sp.y };
  const cp2: Point = { x: cursor.x - dx * 0.5, y: cursor.y };
  const midpoint: Point = {
    x: 0.125 * sp.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * cursor.x,
    y: 0.125 * sp.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * cursor.y,
  };
  return {
    d: `M ${sp.x},${sp.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${cursor.x},${cursor.y}`,
    midpoint,
    sourceAnchor: sp,
    targetAnchor: cursor,
  };
}

/** Get the rect for an endpoint — if node is in a collapsed cluster, use cluster boundary */
export function resolveEndpointRect(
  nodeId: string,
  nodes: Record<string, INode>,
  clusters: Record<string, ICluster>
): Rect | null {
  const node = nodes[nodeId];
  if (!node) return null;

  for (const cluster of Object.values(clusters)) {
    if (cluster.isCollapsed && cluster.memberNodeIds.includes(nodeId)) {
      // Return a small rect at the cluster's collapsed position
      return { x: cluster.x - 60, y: cluster.y - 20, width: 120, height: 40 };
    }
  }
  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

/** Check if a point is inside a rect */
export function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

/** Check if rect A intersects rect B */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
