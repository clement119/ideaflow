import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ICard, IComment } from '../../store/types';
import { ExpandArrow } from './ExpandArrow';
import { CommentThread } from './CommentThread';
import { ContextMenu } from './ContextMenu';
import { NoteCallout } from './NoteCallout';
import { useStore } from '../../store/store';

interface Props {
  card: ICard;
  nodeId: string;
  nodeWidth: number;
  colour: string;
  onEditCard: (from: Partial<ICard>, to: Partial<ICard>) => void;
  onDeleteCard: () => void;
  onAddComment: (c: IComment) => void;
  onDeleteComment: (id: string) => void;
  onEditComment: (id: string, text: string) => void;
  onEditNote: (newNote: string, oldNote: string) => void;
}

const CARD_H = 68;
const COMMENT_GAP = 6;

export function CardItem({
  card, nodeId: _nodeId, nodeWidth, colour,
  onEditCard, onDeleteCard,
  onAddComment, onDeleteComment, onEditComment,
  onEditNote,
}: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const [captionDraft, setCaptionDraft] = useState(card.caption);
  const [hovered, setHovered] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressPos = useRef({ x: 0, y: 0 });

  const execute = useStore(s => s.execute);
  void execute; // used via onEdit* callbacks from parent

  const cardColour = card.colour ?? colour;
  const comments = card.comments ?? [];
  const THREAD_H = comments.length * 50 + 52; // approximate

  // Long-press for mobile context menu
  const onPtrDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    longPressPos.current = { x: e.clientX, y: e.clientY };
    longPressRef.current = setTimeout(() => setMenu(longPressPos.current), 500);
  };
  const cancelLong = () => { if (longPressRef.current) clearTimeout(longPressRef.current); };

  const totalHeight = CARD_H + (commentsOpen ? THREAD_H + COMMENT_GAP : 0);

  return (
    <motion.g
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY }); }}
      onPointerDown={onPtrDown}
      onPointerUp={cancelLong}
      onPointerMove={e => {
        if (Math.hypot(e.clientX - longPressPos.current.x, e.clientY - longPressPos.current.y) > 6) cancelLong();
      }}
      onPointerCancel={cancelLong}
    >
      {/* Card body */}
      <motion.rect
        x={0} y={0} width={nodeWidth} height={CARD_H} rx={12}
        fill={cardColour}
        stroke={hovered ? '#a78bfa' : '#ddd6fe'}
        animate={hovered
          ? { strokeWidth: [1.5, 2.5, 1.5], filter: ['drop-shadow(0 0 2px rgba(99,102,241,0.1))', 'drop-shadow(0 0 8px rgba(99,102,241,0.35))', 'drop-shadow(0 0 2px rgba(99,102,241,0.1))'] }
          : { strokeWidth: 1.5, filter: 'drop-shadow(0 0 0px rgba(99,102,241,0))' }
        }
        transition={hovered ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } : { duration: 0.25 }}
      />

      {/* Title */}
      <foreignObject x={10} y={8} width={nodeWidth - 20} height={26} style={{ pointerEvents: editingTitle ? 'auto' : 'none' }}>
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={() => { onEditCard({ title: card.title }, { title: titleDraft }); setEditingTitle(false); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLElement).blur(); }}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui', color: '#1f2937' }}
          />
        ) : (
          <div
            onDoubleClick={() => { setEditingTitle(true); setTitleDraft(card.title); }}
            style={{ fontSize: 12, fontWeight: 600, fontFamily: 'system-ui', color: '#1f2937', userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {card.title || <span style={{ color: '#9ca3af' }}>Card title…</span>}
          </div>
        )}
      </foreignObject>

      {/* Caption */}
      <foreignObject x={10} y={32} width={nodeWidth - 20} height={28} style={{ pointerEvents: editingCaption ? 'auto' : 'none' }}>
        {editingCaption ? (
          <input
            autoFocus
            value={captionDraft}
            onChange={e => setCaptionDraft(e.target.value)}
            onBlur={() => { onEditCard({ caption: card.caption }, { caption: captionDraft }); setEditingCaption(false); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLElement).blur(); }}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 11, fontFamily: 'system-ui', color: '#6b7280' }}
          />
        ) : (
          <div
            onDoubleClick={() => { setEditingCaption(true); setCaptionDraft(card.caption); }}
            style={{ fontSize: 11, fontFamily: 'system-ui', color: '#6b7280', userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {card.caption || <span style={{ color: '#c4b5fd' }}>Caption…</span>}
          </div>
        )}
      </foreignObject>

      {/* Comment count badge */}
      {comments.length > 0 && !commentsOpen && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={nodeWidth - 16} cy={12} r={9} fill="#6366f1" opacity={0.85} />
          <text x={nodeWidth - 16} y={12} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="700" fill="white" fontFamily="system-ui" style={{ userSelect: 'none' }}>
            {comments.length > 9 ? '9+' : comments.length}
          </text>
        </g>
      )}

      {/* Expand arrow for comments */}
      <ExpandArrow
        expanded={commentsOpen}
        cx={nodeWidth / 2}
        cy={CARD_H + 10}
        onClick={() => setCommentsOpen(v => !v)}
        tooltipCollapsed="Click to see comments"
        tooltipExpanded="Click to collapse comments"
      />

      {/* Comment thread */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.g
            key="thread"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <foreignObject
              x={0}
              y={CARD_H + COMMENT_GAP + 14}
              width={nodeWidth}
              height={THREAD_H}
              style={{ overflow: 'visible' }}
            >
              <CommentThread
                comments={comments}
                width={nodeWidth}
                onAdd={onAddComment}
                onDelete={onDeleteComment}
                onEdit={onEditComment}
              />
            </foreignObject>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Note callout */}
      <AnimatePresence>
        {card.noteVisible && (
          <NoteCallout
            key="card-note"
            note={card.note ?? ''}
            anchorX={nodeWidth / 2}
            anchorY={0}
            onSave={onEditNote}
            onHide={() => onEditCard({ noteVisible: true }, { noteVisible: false })}
          />
        )}
      </AnimatePresence>

      {/* Pulsing note indicator */}
      {card.note !== undefined && !card.noteVisible && (
        <g style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onEditCard({ noteVisible: false }, { noteVisible: true }); }}>
          <motion.circle cx={nodeWidth / 2} cy={-10} r={5} fill={cardColour} stroke="#fde68a" strokeWidth={1}
            animate={{ r: [5, 13, 5], opacity: [0.55, 0, 0.55] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ pointerEvents: 'none' }}
          />
          <circle cx={nodeWidth / 2} cy={-10} r={4} fill={cardColour} stroke="#fde68a" strokeWidth={1.5} />
        </g>
      )}

      {/* Context menu */}
      {menu && (
        <ContextMenu
          x={menu.x} y={menu.y}
          onClose={() => setMenu(null)}
          groups={[
            {
              items: [
                { icon: '💬', label: 'Add Comment', onClick: () => setCommentsOpen(true) },
                { icon: '📌', label: 'Add Note', onClick: () => onEditCard({ noteVisible: card.noteVisible }, { note: card.note ?? '', noteVisible: true }) },
              ],
            },
            {
              items: [
                { icon: '✕', label: 'Delete Card', danger: true, onClick: onDeleteCard },
              ],
            },
          ]}
        />
      )}

      {/* Invisible spacer so total SVG height is correct */}
      <rect x={0} y={0} width={nodeWidth} height={totalHeight} fill="transparent" style={{ pointerEvents: 'none' }} />
    </motion.g>
  );
}
