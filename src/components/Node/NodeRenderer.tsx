import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';
import type { INode } from '../../store/types';
import { NodeDefault } from './NodeDefault';
import { NodeIdea } from './NodeIdea';
import { NodeNote } from './NodeNote';
import { ResizeHandle } from './ResizeHandle';
import { ConnectionHandle } from './ConnectionHandle';
import { NoteCallout } from './NoteCallout';
import { EditNodeCommand, MoveNodeCommand } from '../../store/commands';
import { useIsMobile } from '../../hooks/useMobile';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

function NodeItem({ node, svgRef }: { node: INode; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(node.label);
  const isMobile = useIsMobile();

  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const didDrag = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editStartRef = useRef<{ label: string; height: number } | null>(null);

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
    setTimeout(() => {
      editStartRef.current = { label: node.label, height: node.height };
      setEditing(true);
    }, 50);
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
    editStartRef.current = { label: node.label, height: node.height };
    setLabelDraft(node.label);
    setEditing(true);
    setCursorMode('text-edit');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    useStore.setState(s => ({
      nodes: {
        ...s.nodes,
        [node.id]: {
          ...s.nodes[node.id],
          note: s.nodes[node.id].note ?? '',
          noteVisible: !(s.nodes[node.id].noteVisible ?? false),
        },
      },
    }));
  };

  // Measure textarea and grow node.height to fit content
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const newHeight = Math.max(44, ta.scrollHeight + 20);
    ta.style.height = `${ta.scrollHeight}px`;
    useStore.setState(s => ({
      nodes: { ...s.nodes, [node.id]: { ...s.nodes[node.id], height: newHeight } },
    }));
  }, [node.id]);

  useEffect(() => {
    if (editing) autoResize();
  }, [editing, autoResize]);

  const confirmEdit = () => {
    const snap = editStartRef.current;
    const currentNode = useStore.getState().nodes[node.id];
    const from: Partial<typeof node> = { label: snap?.label ?? node.label, height: snap?.height ?? node.height };
    const to: Partial<typeof node> = { label: labelDraft, height: currentNode?.height ?? node.height };
    if (from.label !== to.label || from.height !== to.height) {
      execute(new EditNodeCommand(node.id, from, to));
    }
    editStartRef.current = null;
    setEditing(false);
    setCursorMode('idle');
  };

  const cancelEdit = () => {
    if (editStartRef.current) {
      useStore.setState(s => ({
        nodes: { ...s.nodes, [node.id]: { ...s.nodes[node.id], height: editStartRef.current!.height } },
      }));
    }
    setLabelDraft(node.label);
    editStartRef.current = null;
    setEditing(false);
    setCursorMode('idle');
  };

  const activeHover = hovered && !isSelected;
  const shape = node.type === 'idea'
    ? <NodeIdea node={node} selected={isSelected} hovered={activeHover} />
    : node.type === 'note'
    ? <NodeNote node={node} selected={isSelected} hovered={activeHover} />
    : <NodeDefault node={node} selected={isSelected} hovered={activeHover} />;

  return (
    <g
      key={node.id}
      transform={`translate(${node.x}, ${node.y})`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onPointerEnter={() => { setHovered(true); if (!dragRef.current) setCursorMode('hover-node'); }}
      onPointerLeave={() => { setHovered(false); if (!dragRef.current) setCursorMode('idle'); }}
    >
      <motion.g
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{ transformOrigin: `${node.width / 2}px ${node.height / 2}px` }}
      >
        {shape}

        {node.emoji && (
          <text x={8} y={node.height / 2 + 5} fontSize={14}>{node.emoji}</text>
        )}

        {/* Label — wider inset (12px H, 10px V) for breathing room */}
        <foreignObject
          x={12} y={10}
          width={node.width - 24} height={node.height - 20}
          style={{ pointerEvents: editing ? 'auto' : 'none', overflow: 'visible' }}
        >
          {!editing ? (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontFamily: 'system-ui, sans-serif', color: '#374151',
              wordBreak: 'break-word', whiteSpace: 'pre-wrap', textAlign: 'center',
              userSelect: 'none', overflow: 'hidden',
            }}>
              {node.label || (isSelected ? '' : <span style={{ color: '#9ca3af' }}>...</span>)}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              autoFocus
              value={labelDraft}
              onChange={e => { setLabelDraft(e.target.value); autoResize(); }}
              onFocus={autoResize}
              onKeyDown={e => {
                if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
              }}
              onBlur={confirmEdit}
              style={{
                width: '100%', display: 'block',
                border: 'none', background: 'transparent', outline: 'none',
                textAlign: 'center', fontSize: 13, fontFamily: 'system-ui, sans-serif',
                color: '#374151', resize: 'none', overflow: 'hidden',
                lineHeight: 1.5, padding: 0,
              }}
            />
          )}
        </foreignObject>

        {/* Connection handles */}
        {(isMobile ? isSelected : hovered) && !editing && (
          <>
            <ConnectionHandle node={node} svgRef={svgRef} side="right" />
            <ConnectionHandle node={node} svgRef={svgRef} side="left" />
            <ConnectionHandle node={node} svgRef={svgRef} side="top" />
            <ConnectionHandle node={node} svgRef={svgRef} side="bottom" />
          </>
        )}

        {/* Resize handle */}
        {isSelected && !editing && <ResizeHandle node={node} />}

        {/* Note callout */}
        <AnimatePresence>
          {node.noteVisible && (
            <NoteCallout
              key="callout"
              note={node.note ?? ''}
              anchorX={node.width / 2}
              anchorY={0}
              onSave={(newNote, oldNote) => execute(new EditNodeCommand(node.id, { note: oldNote }, { note: newNote }))}
              onHide={() => useStore.setState(s => ({
                nodes: { ...s.nodes, [node.id]: { ...s.nodes[node.id], noteVisible: false } },
              }))}
              onSelect={() => selectNode(node.id)}
            />
          )}
        </AnimatePresence>

        {/* Pulsing indicator — shown when note exists but is hidden */}
        {node.note !== undefined && !node.noteVisible && (
          <g
            style={{ cursor: 'pointer' }}
            onClick={e => {
              e.stopPropagation();
              useStore.setState(s => ({
                nodes: { ...s.nodes, [node.id]: { ...s.nodes[node.id], noteVisible: true } },
              }));
            }}
          >
            <motion.circle
              cx={node.width / 2} cy={-10} r={5}
              fill={node.colour}
              stroke="#fde68a"
              strokeWidth={1}
              animate={{ r: [5, 13, 5], opacity: [0.55, 0, 0.55] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{ pointerEvents: 'none' }}
            />
            <circle cx={node.width / 2} cy={-10} r={4} fill={node.colour} stroke="#fde68a" strokeWidth={1.5} />
          </g>
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
