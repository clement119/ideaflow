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

  const hitSize = isMobile ? 32 : 10;
  const hitOffset = isMobile ? 16 : 6;

  return (
    <g>
      {/* Visible handle */}
      <rect
        x={node.width - 6}
        y={node.height - 6}
        width={10}
        height={10}
        rx={2}
        fill="#6366f1"
        opacity={0.7}
        style={{ cursor: 'se-resize' }}
        pointerEvents={isMobile ? 'none' : 'auto'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {/* Larger invisible hit area on touch devices */}
      {isMobile && (
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
      )}
    </g>
  );
}
