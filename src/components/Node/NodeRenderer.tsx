import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';
import type { INode, ICard, IComment } from '../../store/types';
import { NodeDefault } from './NodeDefault';
import { NodeIdea } from './NodeIdea';
import { NodeNote } from './NodeNote';
import { ResizeHandle } from './ResizeHandle';
import { ConnectionHandle } from './ConnectionHandle';
import { NoteCallout } from './NoteCallout';
import { ExpandArrow } from './ExpandArrow';
import { StackedLayersPreview } from './StackedLayersPreview';
import { CardStack } from './CardStack';
import { CommentThread } from './CommentThread';
import { ContextMenu } from './ContextMenu';
import {
  EditNodeCommand, MoveNodeCommand, DeleteNodeCommand,
  AddCardCommand, EditCardCommand, DeleteCardCommand,
  ToggleCardsCommand, AddCommentCommand, DeleteCommentCommand,
} from '../../store/commands';
import { useIsMobile } from '../../hooks/useMobile';
import { newId } from '../../utils/ids';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

function NodeItem({ node, svgRef }: { node: INode; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(node.label);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const isMobile = useIsMobile();

  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const didDrag = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editStartRef = useRef<{ label: string; height: number } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressPos = useRef({ x: 0, y: 0 });

  const selection = useStore(s => s.selection);
  const execute = useStore(s => s.execute);
  const selectNode = useStore(s => s.selectNode);
  const toggleSelectNode = useStore(s => s.toggleSelectNode);
  const setCursorMode = useStore(s => s.setCursorMode);
  const transform = useStore(s => s.canvasTransform);

  const isSelected = selection.nodeIds.includes(node.id);
  const multiSelected = selection.nodeIds.length > 1 && isSelected;

  const cards = node.cards ?? [];
  const comments = node.comments ?? [];
  const cardsExpanded = node.cardsExpanded ?? false;
  const hasCards = cards.length > 0;

  // Auto-open edit for freshly created empty nodes
  const wasEmpty = useRef(node.label === '');
  if (wasEmpty.current && isSelected && !editing && node.label === '') {
    wasEmpty.current = false;
    setTimeout(() => {
      editStartRef.current = { label: node.label, height: node.height };
      setEditing(true);
    }, 50);
  }

  const cancelLong = () => { if (longPressRef.current) clearTimeout(longPressRef.current); };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (editing) return;
    didDrag.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: node.x, originY: node.y };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    setCursorMode('drag-node');
    // Long-press for context menu
    longPressPos.current = { x: e.clientX, y: e.clientY };
    longPressRef.current = setTimeout(() => {
      if (!didDrag.current) setMenu(longPressPos.current);
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / transform.zoom;
    const dy = (e.clientY - dragRef.current.startY) / transform.zoom;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) { didDrag.current = true; cancelLong(); }

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
    cancelLong();
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
    setMenu({ x: e.clientX, y: e.clientY });
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

  // ── Card & comment handlers ────────────────────────────────────────────────
  const addCard = () => {
    const card: ICard = { id: newId(), title: '', caption: '', colour: node.colour };
    execute(new AddCardCommand(node.id, card));
  };

  const addComment = () => {
    // Expand card area to show comment thread on the node itself
    // We don't auto-expand here; CommentThread is always visible below cards
  };

  const activeHover = hovered && !isSelected;
  const shape = node.type === 'idea'
    ? <NodeIdea node={node} selected={isSelected} hovered={activeHover} />
    : node.type === 'note'
    ? <NodeNote node={node} selected={isSelected} hovered={activeHover} />
    : <NodeDefault node={node} selected={isSelected} hovered={activeHover} />;

  // Height below bubble for expand arrow placement
  const arrowCY = node.height + (hasCards && !cardsExpanded ? 16 : 10);

  return (
    <g
      key={node.id}
      transform={`translate(${node.x}, ${node.y})`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelLong}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onPointerEnter={() => { setHovered(true); if (!dragRef.current) setCursorMode('hover-node'); }}
      onPointerLeave={() => { setHovered(false); if (!dragRef.current) setCursorMode('idle'); cancelLong(); }}
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

        {/* Label */}
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

        {/* Stacked layers preview (collapsed + has cards) */}
        {hasCards && !cardsExpanded && (
          <StackedLayersPreview
            nodeWidth={node.width}
            nodeHeight={node.height}
            count={cards.length}
            nodeColour={node.colour}
          />
        )}

        {/* Expand/collapse arrow — only when there are cards */}
        {hasCards && (
          <ExpandArrow
            expanded={cardsExpanded}
            cx={node.width / 2}
            cy={arrowCY}
            onClick={() => execute(new ToggleCardsCommand(node.id, !cardsExpanded))}
          />
        )}

        {/* Card stack */}
        {cardsExpanded && (
          <CardStack
            cards={cards}
            nodeId={node.id}
            nodeWidth={node.width}
            nodeHeight={node.height}
            nodeColour={node.colour}
            onEditCard={(cardId, from, to) => execute(new EditCardCommand(node.id, cardId, from, to))}
            onDeleteCard={(_cardId, card) => execute(new DeleteCardCommand(node.id, card))}
            onAddComment={(cardId, c) => execute(new AddCommentCommand(node.id, cardId, c))}
            onDeleteComment={(cardId, commentId) => {
              const card = useStore.getState().nodes[node.id]?.cards?.find(c => c.id === cardId);
              const cm = card?.comments?.find(c => c.id === commentId);
              if (cm) execute(new DeleteCommentCommand(node.id, cardId, cm));
            }}
            onEditComment={(cardId, commentId, text) => {
              const card = useStore.getState().nodes[node.id]?.cards?.find(c => c.id === cardId);
              const cm = card?.comments?.find(c => c.id === commentId);
              if (cm) execute(new EditCardCommand(node.id, cardId,
                { comments: card!.comments },
                { comments: card!.comments!.map(c => c.id === commentId ? { ...c, text } : c) }
              ));
            }}
            onEditNote={(cardId, newNote, oldNote) => execute(new EditCardCommand(node.id, cardId, { note: oldNote }, { note: newNote }))}
          />
        )}

        {/* Node-level comment thread */}
        {comments.length > 0 && (
          <foreignObject
            x={0}
            y={node.height + (hasCards ? (cardsExpanded ? 500 : 30) : 22)}
            width={node.width}
            height={comments.length * 52 + 60}
            style={{ overflow: 'visible' }}
          >
            <CommentThread
              comments={comments}
              width={node.width}
              onAdd={c => execute(new AddCommentCommand(node.id, null, c))}
              onDelete={id => {
                const cm = useStore.getState().nodes[node.id]?.comments?.find(c => c.id === id);
                if (cm) execute(new DeleteCommentCommand(node.id, null, cm));
              }}
              onEdit={(id, text) => {
                const current = useStore.getState().nodes[node.id];
                if (!current) return;
                execute(new EditNodeCommand(node.id,
                  { comments: current.comments },
                  { comments: (current.comments ?? []).map(c => c.id === id ? { ...c, text } : c) }
                ));
              }}
            />
          </foreignObject>
        )}

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

      {/* Context menu (right-click / long-press) */}
      {menu && (
        <ContextMenu
          x={menu.x} y={menu.y}
          onClose={() => setMenu(null)}
          groups={[
            {
              items: [
                {
                  icon: '🃏', label: 'Add Card',
                  onClick: addCard,
                },
                {
                  icon: '💬', label: 'Add Comment',
                  onClick: () => {
                    addComment();
                    const c: IComment = { id: newId(), text: '', createdAt: Date.now() };
                    execute(new AddCommentCommand(node.id, null, c));
                  },
                },
                {
                  icon: '📌', label: node.noteVisible ? 'Hide Note' : (node.note !== undefined ? 'Show Note' : 'Add Note'),
                  onClick: () => useStore.setState(s => ({
                    nodes: {
                      ...s.nodes,
                      [node.id]: {
                        ...s.nodes[node.id],
                        note: s.nodes[node.id].note ?? '',
                        noteVisible: !(s.nodes[node.id].noteVisible ?? false),
                      },
                    },
                  })),
                },
              ],
            },
            {
              items: [
                {
                  icon: '✕', label: 'Delete',
                  danger: true,
                  onClick: () => {
                    execute(new DeleteNodeCommand(node.id, node));
                    useStore.getState().clearSelection();
                  },
                },
              ],
            },
          ]}
        />
      )}
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
