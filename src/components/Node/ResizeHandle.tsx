import { useRef } from 'react';
import type { INode } from '../../store/types';
import { useStore } from '../../store/store';
import { ResizeNodeCommand } from '../../store/commands';
import { useIsMobile } from '../../hooks/useMobile';

interface Props {
  node: INode;
}

const MIN_SIZE = 60;

export function ResizeHandle({ node }: Props) {
  const fromRef = useRef<{ width: number; height: number } | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const execute = useStore(s => s.execute);
  const setCursorMode = useStore(s => s.setCursorMode);
  const isMobile = useIsMobile();

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    fromRef.current = { width: node.width, height: node.height };
    startRef.current = { x: e.clientX, y: e.clientY };
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    setCursorMode('drag-node');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startRef.current || !fromRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    const newW = Math.max(MIN_SIZE, fromRef.current.width + dx);
    const newH = Math.max(MIN_SIZE / 2, fromRef.current.height + dy);
    // Apply directly to store without command (commit on pointerup)
    useStore.setState(s => ({
      nodes: { ...s.nodes, [node.id]: { ...s.nodes[node.id], width: newW, height: newH } },
    }));
  };

  const handlePointerUp = () => {
    if (!fromRef.current) return;
    const current = useStore.getState().nodes[node.id];
    if (current.width !== fromRef.current.width || current.height !== fromRef.current.height) {
      execute(new ResizeNodeCommand(node.id, fromRef.current, { width: current.width, height: current.height }));
    }
    fromRef.current = null;
    startRef.current = null;
    setCursorMode('idle');
  };

  // Desktop: 28×28 hit area; Mobile: 36×36 hit area
  const hitSize = isMobile ? 36 : 28;
  const hitOffset = hitSize / 2;

  // Visible handle dimensions
  const visW = 12;
  const visH = 12;
  const visX = node.width - visW + 2;
  const visY = node.height - visH + 2;

  return (
    <g>
      {/* Visible handle */}
      <rect
        x={visX}
        y={visY}
        width={visW}
        height={visH}
        rx={3}
        fill="#6366f1"
        opacity={0.85}
        pointerEvents="none"
      />
      {/* Grip lines inside the visible handle */}
      <line x1={visX + 4} y1={visY + visH - 3} x2={visX + visW - 3} y2={visY + 4} stroke="white" strokeWidth={1.5} strokeLinecap="round" pointerEvents="none" />
      <line x1={visX + 7} y1={visY + visH - 3} x2={visX + visW - 3} y2={visY + 7} stroke="white" strokeWidth={1.5} strokeLinecap="round" pointerEvents="none" />
      {/* Large invisible hit area (both desktop and mobile) */}
      <rect
        x={node.width - hitOffset}
        y={node.height - hitOffset}
        width={hitSize}
        height={hitSize}
        fill="transparent"
        style={{ cursor: 'se-resize' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </g>
  );
}
