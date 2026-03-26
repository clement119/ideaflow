import { useRef, useCallback } from 'react';
import { useStore } from '../../store/store';
import { CURSORS } from '../../assets/cursors';
import { screenToCanvas, zoomAroundPoint } from '../../utils/viewport';
import { clamp } from '../../utils/geometry';
import { AddNodeCommand } from '../../store/commands';
import { newId } from '../../utils/ids';
import { DEFAULT_NODE_COLOUR } from '../../utils/colours';
import { DotGrid } from './DotGrid';
import { Minimap } from './Minimap';
import { NodeRenderer } from '../Node/NodeRenderer';
import { EdgeRenderer } from '../Edge/EdgeRenderer';
import { ClusterRenderer } from '../Cluster/ClusterRenderer';
import { SelectionRect } from '../Selection/SelectionRect';
import { ContextualToolbar } from '../Toolbar/ContextualToolbar';
import { EmptyState } from '../Onboarding/EmptyState';
import { HintTooltip } from '../Onboarding/HintTooltip';
import { ShortcutsModal } from '../Overlays/ShortcutsModal';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  // Tracks all active pointer IDs that started on the canvas background (for pinch-to-zoom)
  const bgPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const transform = useStore(s => s.canvasTransform);
  const cursorMode = useStore(s => s.cursorMode);
  const backgroundStyle = useStore(s => s.backgroundStyle);
  const showMinimap = useStore(s => s.showMinimap);
  const setCanvasTransform = useStore(s => s.setCanvasTransform);
  const setCursorMode = useStore(s => s.setCursorMode);
  const clearSelection = useStore(s => s.clearSelection);
  const execute = useStore(s => s.execute);

  // ─── Zoom ───────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const delta = e.ctrlKey ? e.deltaY * 0.01 : e.deltaY * 0.001;
    const newZoom = clamp(transform.zoom * (1 - delta), MIN_ZOOM, MAX_ZOOM);
    setCanvasTransform(zoomAroundPoint(transform, cursor, newZoom));
  }, [transform, setCanvasTransform]);

  // ─── Pan + Pinch-to-zoom ──────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const onBg = (e.target as SVGElement).id === 'canvas-bg' || e.target === svgRef.current;
    if (!onBg) return;
    bgPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    setCursorMode('pan-drag');
    if (bgPointersRef.current.size === 1) {
      panRef.current = { startX: e.clientX, startY: e.clientY, originX: transform.x, originY: transform.y };
    }
  }, [transform, setCursorMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!bgPointersRef.current.has(e.pointerId)) return;

    if (bgPointersRef.current.size === 2) {
      // Pinch: use distance delta for zoom + midpoint delta for pan
      const prev = bgPointersRef.current.get(e.pointerId)!;
      const other = Array.from(bgPointersRef.current.entries()).find(([id]) => id !== e.pointerId)![1];
      const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
      const currDist = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      const prevMidX = (prev.x + other.x) / 2;
      const prevMidY = (prev.y + other.y) / 2;
      const currMidX = (e.clientX + other.x) / 2;
      const currMidY = (e.clientY + other.y) / 2;
      if (prevDist > 0) {
        const rect = svgRef.current!.getBoundingClientRect();
        const current = useStore.getState().canvasTransform;
        const zoomed = zoomAroundPoint(current, { x: currMidX - rect.left, y: currMidY - rect.top }, clamp(current.zoom * (currDist / prevDist), MIN_ZOOM, MAX_ZOOM));
        useStore.setState({ canvasTransform: { ...zoomed, x: zoomed.x + (currMidX - prevMidX), y: zoomed.y + (currMidY - prevMidY) } });
      }
      bgPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      return;
    }

    // Single pointer: pan
    if (!panRef.current) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setCanvasTransform({ ...transform, x: panRef.current.originX + dx, y: panRef.current.originY + dy });
  }, [transform, setCanvasTransform]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    bgPointersRef.current.delete(e.pointerId);
    if (bgPointersRef.current.size === 1) {
      // Went from pinch → single pan: reset reference to avoid jump
      const [remaining] = bgPointersRef.current.values();
      const t = useStore.getState().canvasTransform;
      panRef.current = { startX: remaining.x, startY: remaining.y, originX: t.x, originY: t.y };
    } else if (bgPointersRef.current.size === 0) {
      panRef.current = null;
      setCursorMode('idle');
    }
  }, [setCursorMode]);

  // ─── Double-click to create node ─────────────────────────────────────────────
  const handleDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).id !== 'canvas-bg') return;
    const rect = svgRef.current!.getBoundingClientRect();
    const { x, y } = screenToCanvas(e.clientX, e.clientY, transform, rect);
    const node = {
      id: newId(),
      type: 'default' as const,
      label: '',
      x: x - 60,
      y: y - 20,
      width: 120,
      height: 40,
      colour: DEFAULT_NODE_COLOUR,
    };
    execute(new AddNodeCommand(node));
    // Select the new node for immediate editing
    useStore.getState().selectNode(node.id);
    setCursorMode('text-edit');
  }, [transform, execute, setCursorMode]);

  // ─── Click on empty canvas → clear selection ─────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).id === 'canvas-bg') {
      clearSelection();
      setCursorMode('idle');
    }
  }, [clearSelection, setCursorMode]);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white select-none"
      style={{ cursor: CURSORS[cursorMode] }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
        style={{ display: 'block', touchAction: 'none' }}
      >
        {backgroundStyle === 'grid' && <DotGrid transform={transform} />}
        {backgroundStyle === 'grid' && (
          <rect id="canvas-bg" width="100%" height="100%" fill="url(#dot-grid)" />
        )}
        {backgroundStyle === 'plain' && (
          <rect id="canvas-bg" width="100%" height="100%" fill="white" />
        )}

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.zoom})`}>
          <ClusterRenderer svgRef={svgRef} />
          <EdgeRenderer svgRef={svgRef} />
          <NodeRenderer svgRef={svgRef} />
          <SelectionRect svgRef={svgRef} />
        </g>
      </svg>

      {showMinimap && <Minimap />}
      <ContextualToolbar svgRef={svgRef} />
      <EmptyState />
      <HintTooltip />
      <ShortcutsModal />
    </div>
  );
}
