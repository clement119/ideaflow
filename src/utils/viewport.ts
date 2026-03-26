import type { CanvasTransform } from '../store/types';

/** Convert a screen-space point to canvas (world) coordinates */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  t: CanvasTransform,
  svgRect: DOMRect
): { x: number; y: number } {
  return {
    x: (screenX - svgRect.left - t.x) / t.zoom,
    y: (screenY - svgRect.top - t.y) / t.zoom,
  };
}

/** Convert a canvas (world) point to screen-space coordinates */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  t: CanvasTransform,
  svgRect: DOMRect
): { x: number; y: number } {
  return {
    x: canvasX * t.zoom + t.x + svgRect.left,
    y: canvasY * t.zoom + t.y + svgRect.top,
  };
}

/**
 * Compute a new canvas transform after zooming around a screen-space cursor point.
 * The world point under the cursor stays fixed.
 */
export function zoomAroundPoint(
  t: CanvasTransform,
  cursorScreen: { x: number; y: number },
  newZoom: number
): CanvasTransform {
  // World point under cursor before zoom
  const wx = (cursorScreen.x - t.x) / t.zoom;
  const wy = (cursorScreen.y - t.y) / t.zoom;
  // Re-project to keep wx/wy fixed under cursor
  return {
    x: cursorScreen.x - wx * newZoom,
    y: cursorScreen.y - wy * newZoom,
    zoom: newZoom,
  };
}

/** Fit all nodes into the viewport, returning the new transform */
export function fitToViewport(
  nodes: Array<{ x: number; y: number; width: number; height: number }>,
  viewportWidth: number,
  viewportHeight: number,
  padding = 80
): CanvasTransform {
  if (!nodes.length) return { x: 0, y: 0, zoom: 1 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const zoom = Math.min(
    (viewportWidth - padding * 2) / contentW,
    (viewportHeight - padding * 2) / contentH,
    1.5
  );

  return {
    x: (viewportWidth - contentW * zoom) / 2 - minX * zoom,
    y: (viewportHeight - contentH * zoom) / 2 - minY * zoom,
    zoom,
  };
}
