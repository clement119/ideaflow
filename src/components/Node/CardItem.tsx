import { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ICard, IComment } from '../../store/types';
import { ExpandArrow } from './ExpandArrow';
import { CommentThread } from './CommentThread';
import { ContextMenu } from './ContextMenu';
import { useIsMobile } from '../../hooks/useMobile';

interface Props {
  card: ICard;
  nodeWidth: number;
  colour: string;
  onEditCard: (from: Partial<ICard>, to: Partial<ICard>) => void;
  onDeleteCard: () => void;
  onAddComment: (c: IComment) => void;
  onDeleteComment: (id: string) => void;
  onEditComment: (id: string, text: string) => void;
}

export const CARD_H = 68;
const THREAD_W = 220;
const THREAD_OFFSET_X = 16;   // gap between card right edge and thread panel

export const CardItem = memo(function CardItem({
  card, nodeWidth, colour,
  onEditCard, onDeleteCard,
  onAddComment, onDeleteComment, onEditComment,
}: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const [captionDraft, setCaptionDraft] = useState(card.caption);
  const [hovered, setHovered] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const isMobile = useIsMobile();

  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressPos = useRef({ x: 0, y: 0 });

  const cardColour = card.colour ?? colour;
  const comments = card.comments ?? [];

  const cancelLong = () => { if (longPressRef.current) clearTimeout(longPressRef.current); };

  const onPtrDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    longPressPos.current = { x: e.clientX, y: e.clientY };
    longPressRef.current = setTimeout(() => setMenu(longPressPos.current), 500);
  };

  // Approximate height of comment thread panel
  const threadH = Math.max(120, comments.length * 52 + 60);

  return (
    <motion.g
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => { setHovered(false); cancelLong(); }}
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
        animate={
          hovered && !isMobile
            ? {
                strokeWidth: [1.5, 2.5, 1.5],
                filter: ['drop-shadow(0 0 2px rgba(99,102,241,0.1))', 'drop-shadow(0 0 8px rgba(99,102,241,0.35))', 'drop-shadow(0 0 2px rgba(99,102,241,0.1))'],
              }
            : { strokeWidth: 1.5, filter: 'drop-shadow(0 0 0px rgba(99,102,241,0))' }
        }
        transition={hovered && !isMobile ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } : { duration: 0.2 }}
      />

      {/* Title — foreignObject always has pointer events; inner div captures double-click */}
      <foreignObject x={10} y={8} width={nodeWidth - 28} height={28} style={{ overflow: 'visible' }}>
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={() => { onEditCard({ title: card.title }, { title: titleDraft }); setEditingTitle(false); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLElement).blur(); }}
            onPointerDown={e => e.stopPropagation()}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui', color: '#1f2937' }}
          />
        ) : (
          <div
            onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); setTitleDraft(card.title); }}
            onPointerDown={e => e.stopPropagation()}
            style={{ fontSize: 12, fontWeight: 600, fontFamily: 'system-ui', color: '#1f2937', userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', height: '100%', display: 'flex', alignItems: 'center' }}
          >
            {card.title || <span style={{ color: '#9ca3af', fontWeight: 400 }}>Card title…</span>}
          </div>
        )}
      </foreignObject>

      {/* Caption */}
      <foreignObject x={10} y={38} width={nodeWidth - 28} height={24} style={{ overflow: 'visible' }}>
        {editingCaption ? (
          <input
            autoFocus
            value={captionDraft}
            onChange={e => setCaptionDraft(e.target.value)}
            onBlur={() => { onEditCard({ caption: card.caption }, { caption: captionDraft }); setEditingCaption(false); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLElement).blur(); }}
            onPointerDown={e => e.stopPropagation()}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 11, fontFamily: 'system-ui', color: '#6b7280' }}
          />
        ) : (
          <div
            onDoubleClick={e => { e.stopPropagation(); setEditingCaption(true); setCaptionDraft(card.caption); }}
            onPointerDown={e => e.stopPropagation()}
            style={{ fontSize: 11, fontFamily: 'system-ui', color: '#6b7280', userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', height: '100%', display: 'flex', alignItems: 'center' }}
          >
            {card.caption || <span style={{ color: '#c4b5fd' }}>Caption…</span>}
          </div>
        )}
      </foreignObject>

      {/* Comment expand arrow — right side of card */}
      <ExpandArrow
        expanded={commentsOpen}
        cx={nodeWidth + 14}
        cy={CARD_H / 2}
        onClick={() => { setCommentsOpen(v => !v); }}
        tooltipCollapsed={`${comments.length} comment${comments.length !== 1 ? 's' : ''} — click to open`}
        tooltipExpanded="Click to close comments"
      />

      {/* Comment count badge on the arrow */}
      {comments.length > 0 && !commentsOpen && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={nodeWidth + 22} cy={CARD_H / 2 - 10} r={7} fill="#6366f1" />
          <text x={nodeWidth + 22} y={CARD_H / 2 - 10} textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fontWeight="700" fill="white" fontFamily="system-ui" style={{ userSelect: 'none' }}>
            {comments.length > 9 ? '9+' : comments.length}
          </text>
        </g>
      )}

      {/* Comment thread — floats to the RIGHT, doesn't push cards below */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.g
            key="thread"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <foreignObject
              x={nodeWidth + THREAD_OFFSET_X + 10}
              y={0}
              width={THREAD_W}
              height={threadH}
              style={{ overflow: 'visible' }}
            >
              <CommentThread
                comments={comments}
                width={THREAD_W}
                onAdd={c => { onAddComment(c); }}
                onDelete={onDeleteComment}
                onEdit={onEditComment}
              />
            </foreignObject>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Context menu */}
      {menu && (
        <ContextMenu
          x={menu.x} y={menu.y}
          onClose={() => setMenu(null)}
          groups={[
            {
              items: [
                {
                  icon: '💬',
                  label: 'Add Comment',
                  onClick: () => setCommentsOpen(true),
                },
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
    </motion.g>
  );
});
