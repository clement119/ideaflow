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

  // ─── Pan ────────────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const onBg = (e.target as SVGElement).id === 'canvas-bg' || e.target === svgRef.current;
    if (!onBg) return;
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    setCursorMode('pan-drag');
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  }, [transform, setCursorMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!panRef.current) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setCanvasTransform({
      ...transform,
      x: panRef.current.originX + dx,
      y: panRef.current.originY + dy,
    });
  }, [transform, setCanvasTransform]);

  const handlePointerUp = useCallback(() => {
    if (panRef.current) {
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
        style={{ display: 'block' }}
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
