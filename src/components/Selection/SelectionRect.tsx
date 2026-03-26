import { useState, useRef } from 'react';
import { useStore } from '../../store/store';
import { rectsIntersect } from '../../utils/geometry';
import { screenToCanvas } from '../../utils/viewport';
import type { Rect } from '../../utils/geometry';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export function SelectionRect({ svgRef }: Props) {
  const [rect, setRect] = useState<Rect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const nodes = useStore(s => s.nodes);
  const transform = useStore(s => s.canvasTransform);
  const setSelection = useStore(s => s.setSelection);

  // These are attached to a transparent overlay rect rendered in Canvas.tsx via id="canvas-bg"
  // Instead, we listen on the SVG via useEffect but do it here via a transparent rect

  const handlePointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    if (e.button !== 0) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgRect = svgEl.getBoundingClientRect();
    const pos = screenToCanvas(e.clientX, e.clientY, transform, svgRect);
    startRef.current = pos;
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!startRef.current) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgRect = svgEl.getBoundingClientRect();
    const pos = screenToCanvas(e.clientX, e.clientY, transform, svgRect);
    const x = Math.min(pos.x, startRef.current.x);
    const y = Math.min(pos.y, startRef.current.y);
    const width = Math.abs(pos.x - startRef.current.x);
    const height = Math.abs(pos.y - startRef.current.y);
    if (width > 4 || height > 4) {
      setRect({ x, y, width, height });
    }
  };

  const handlePointerUp = () => {
    if (rect) {
      const enclosed = Object.values(nodes).filter(n =>
        rectsIntersect(rect, { x: n.x, y: n.y, width: n.width, height: n.height })
      );
      if (enclosed.length) {
        setSelection({ nodeIds: enclosed.map(n => n.id), edgeIds: [], clusterId: null });
      }
    }
    startRef.current = null;
    setRect(null);
  };

  return (
    <>
      {/* Invisible interaction layer for drag-select on empty canvas */}
      <rect
        x={-50000}
        y={-50000}
        width={100000}
        height={100000}
        fill="transparent"
        id="selection-layer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ pointerEvents: 'none' }} // Nodes will handle their own events
      />

      {/* Visible selection rect */}
      {rect && (
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill="rgba(99,102,241,0.05)"
          stroke="#6366f1"
          strokeWidth={1}
          strokeDasharray="4 3"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </>
  );
}
