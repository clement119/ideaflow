import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';
import type { INode } from '../../store/types';
import { NodeDefault } from './NodeDefault';
import { NodeIdea } from './NodeIdea';
import { NodeNote } from './NodeNote';
import { ResizeHandle } from './ResizeHandle';
import { ConnectionHandle } from './ConnectionHandle';
import { EditNodeCommand, MoveNodeCommand } from '../../store/commands';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

function NodeItem({ node, svgRef }: { node: INode; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(node.label);

  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const didDrag = useRef(false);

  const selection = useStore(s => s.selection);
  const execute = useStore(s => s.execute);
  const selectNode = useStore(s => s.selectNode);
  const toggleSelectNode = useStore(s => s.toggleSelectNode);
  const setCursorMode = useStore(s => s.setCursorMode);
  const transform = useStore(s => s.canvasTransform);

  const isSelected = selection.nodeIds.includes(node.id);
  const multiSelected = selection.nodeIds.length > 1 && isSelected;

  // Auto-open edit for freshly created empty nodes
  const wasEmpty = useRef(node.label === '');
  if (wasEmpty.current && isSelected && !editing && node.label === '') {
    wasEmpty.current = false;
    setTimeout(() => setEditing(true), 50);
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (editing) return;
    didDrag.current = false;

    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: node.x, originY: node.y };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    setCursorMode('drag-node');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / transform.zoom;
    const dy = (e.clientY - dragRef.current.startY) / transform.zoom;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag.current = true;

    if (didDrag.current) {
      if (multiSelected) {
        // Move all selected nodes
        const sel = useStore.getState().selection.nodeIds;
        const nodes = useStore.getState().nodes;
        const updated: Record<string, INode> = { ...nodes };
        sel.forEach(id => {
          if (nodes[id]) {
            updated[id] = { ...nodes[id], x: nodes[id].x + (e.movementX / transform.zoom), y: nodes[id].y + (e.movementY / transform.zoom) };
          }
        });
        useStore.setState({ nodes: updated });
      } else {
        useStore.setState(s => ({
          nodes: { ...s.nodes, [node.id]: { ...s.nodes[node.id], x: dragRef.current!.originX + dx, y: dragRef.current!.originY + dy } },
        }));
      }
    }
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    if (didDrag.current) {
      const current = useStore.getState().nodes[node.id];
      execute(new MoveNodeCommand(node.id, { x: dragRef.current.originX, y: dragRef.current.originY }, { x: current.x, y: current.y }));
    }
    dragRef.current = null;
    setCursorMode(hovered ? 'hover-node' : 'idle');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didDrag.current) return;
    if (e.shiftKey) {
      toggleSelectNode(node.id);
    } else {
      selectNode(node.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setLabelDraft(node.label);
    setCursorMode('text-edit');
  };

  const confirmEdit = () => {
    if (labelDraft !== node.label) {
      execute(new EditNodeCommand(node.id, { label: node.label }, { label: labelDraft }));
    }
    setEditing(false);
    setCursorMode('idle');
  };

  const shape = node.type === 'idea' ? <NodeIdea node={node} selected={isSelected} />
    : node.type === 'note' ? <NodeNote node={node} selected={isSelected} />
    : <NodeDefault node={node} selected={isSelected} />;

  return (
    // Outer plain <g> owns position — never touches Framer Motion so drags are instant
    <g
      key={node.id}
      transform={`translate(${node.x}, ${node.y})`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerEnter={() => { setHovered(true); if (!dragRef.current) setCursorMode('hover-node'); }}
      onPointerLeave={() => { setHovered(false); if (!dragRef.current) setCursorMode('idle'); }}
    >
      {/* Inner motion.g handles only the spring entrance/exit animation */}
      <motion.g
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{ transformOrigin: `${node.width / 2}px ${node.height / 2}px` }}
      >
        {shape}

        {/* Emoji prefix */}
        {node.emoji && (
          <text x={8} y={node.height / 2 + 5} fontSize={14}>{node.emoji}</text>
        )}

        {/* Label (display or edit) */}
        {!editing ? (
          <text
            x={node.width / 2}
            y={node.height / 2 + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={13}
            fill="#374151"
            fontFamily="system-ui, sans-serif"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {node.label || (isSelected ? '' : <tspan fill="#9ca3af">...</tspan>)}
          </text>
        ) : (
          <foreignObject x={4} y={4} width={node.width - 8} height={node.height - 8}>
            <input
              autoFocus
              value={labelDraft}
              onChange={e => setLabelDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); }
                if (e.key === 'Escape') { setEditing(false); setCursorMode('idle'); }
              }}
              onBlur={confirmEdit}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                textAlign: 'center',
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                color: '#374151',
              }}
            />
          </foreignObject>
        )}

        {/* Connection handles on all 4 sides (only when hovered and not editing) */}
        {hovered && !editing && (
          <>
            <ConnectionHandle node={node} svgRef={svgRef} side="right" />
            <ConnectionHandle node={node} svgRef={svgRef} side="left" />
            <ConnectionHandle node={node} svgRef={svgRef} side="top" />
            <ConnectionHandle node={node} svgRef={svgRef} side="bottom" />
          </>
        )}

        {/* Resize handle (only when selected) */}
        {isSelected && !editing && (
          <ResizeHandle node={node} />
        )}
      </motion.g>
    </g>
  );
}

export function NodeRenderer({ svgRef }: Props) {
  const nodes = useStore(s => s.nodes);

  return (
    <AnimatePresence>
      {Object.values(nodes).map(node => (
        <NodeItem key={node.id} node={node} svgRef={svgRef} />
      ))}
    </AnimatePresence>
  );
}
