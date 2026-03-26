import { useRef } from 'react';
import type { INode } from '../../store/types';
import { useStore } from '../../store/store';
import { AddNodeCommand, AddEdgeCommand } from '../../store/commands';
import { newId } from '../../utils/ids';
import { DEFAULT_NODE_COLOUR } from '../../utils/colours';
import { screenToCanvas } from '../../utils/viewport';

interface Props {
  node: INode;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export function ConnectionHandle({ node, svgRef }: Props) {
  const dragging = useRef(false);
  const setCursorMode = useStore(s => s.setCursorMode);
  const setDraftEdge = useStore(s => s.setDraftEdge);
  const execute = useStore(s => s.execute);
  const transform = useStore(s => s.canvasTransform);

  const cx = node.width + 8;
  const cy = node.height / 2;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    setCursorMode('draw-edge');
    const rect = svgRef.current!.getBoundingClientRect();
    const pos = screenToCanvas(e.clientX, e.clientY, transform, rect);
    setDraftEdge({ sourceId: node.id, x: pos.x, y: pos.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const pos = screenToCanvas(e.clientX, e.clientY, transform, rect);
    setDraftEdge({ sourceId: node.id, x: pos.x, y: pos.y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    setDraftEdge(null);
    setCursorMode('idle');

    const rect = svgRef.current!.getBoundingClientRect();
    const pos = screenToCanvas(e.clientX, e.clientY, transform, rect);

    // Check if we dropped on an existing node
    const nodes = useStore.getState().nodes;
    const target = Object.values(nodes).find(
      n => n.id !== node.id &&
        pos.x >= n.x && pos.x <= n.x + n.width &&
        pos.y >= n.y && pos.y <= n.y + n.height
    );

    if (target) {
      execute(new AddEdgeCommand({ id: newId(), sourceId: node.id, targetId: target.id, style: 'solid' }));
    } else {
      // Create new connected node
      const newNode = {
        id: newId(),
        type: 'default' as const,
        label: '',
        x: pos.x - 60,
        y: pos.y - 20,
        width: 120,
        height: 40,
        colour: DEFAULT_NODE_COLOUR,
      };
      execute(new AddNodeCommand(newNode));
      execute(new AddEdgeCommand({ id: newId(), sourceId: node.id, targetId: newNode.id, style: 'solid' }));
      useStore.getState().selectNode(newNode.id);
      useStore.getState().setCursorMode('text-edit');
    }
  };

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="rgba(99,102,241,0.15)"
        stroke="#6366f1"
        strokeWidth={1.5}
        style={{ cursor: `url("${undefined}") 16 16, crosshair` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <circle cx={cx} cy={cy} r={3} fill="#6366f1" />
    </g>
  );
}
