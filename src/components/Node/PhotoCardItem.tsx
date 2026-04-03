import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ICard, IComment } from '../../store/types';
import { ExpandArrow } from './ExpandArrow';
import { CommentPanelPortal } from './CommentPanelPortal';
import { ContextMenu } from './ContextMenu';
import { pickImageFile } from '../../utils/imageUtils';
import { useStore } from '../../store/store';

export const PHOTO_CARD_MIN_W = 100;

const TITLE_H = 32;
const TOP_PAD = 8;
const SIDE_PAD = 10;
const BOT_PAD = 14;

interface Props {
  card: ICard;
  nodeWidth: number;
  colour: string;
  cardCanvasX: number;
  cardCanvasY: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onEditCard: (from: Partial<ICard>, to: Partial<ICard>) => void;
  onDeleteCard: () => void;
  onAddComment: (c: IComment) => void;
  onDeleteComment: (id: string) => void;
  onEditComment: (id: string, text: string) => void;
}

export const PhotoCardItem = memo(function PhotoCardItem({
  card, nodeWidth, colour,
  cardCanvasX, cardCanvasY, svgRef,
  onEditCard, onDeleteCard,
  onAddComment, onDeleteComment, onEditComment,
}: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const [hovered, setHovered] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [captionH, setCaptionH] = useState(32);

  const [localWidth, setLocalWidth] = useState(card.cardWidth ?? nodeWidth);
  const localWidthRef = useRef(localWidth);
  const captionHRef = useRef(captionH);

  const resizeDragRef = useRef<{ startX: number; startW: number } | null>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressPos = useRef({ x: 0, y: 0 });

  const comments = card.comments ?? [];
  const cardW = Math.max(PHOTO_CARD_MIN_W, localWidth);
  const aspectRatio = card.imageAspectRatio ?? 4 / 3;
  const imageH = Math.round((cardW - 2 * SIDE_PAD) / aspectRatio);
  const totalH = TITLE_H + TOP_PAD + imageH + BOT_PAD + captionH;

  // Sync localWidth from card.cardWidth on undo/redo
  useEffect(() => {
    const w = card.cardWidth ?? nodeWidth;
    setLocalWidth(w);
    localWidthRef.current = w;
  }, [card.cardWidth, nodeWidth]);

  const autoResizeCaption = () => {
    const ta = captionRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const newH = Math.max(32, ta.scrollHeight + 16);
    if (newH !== captionHRef.current) {
      captionHRef.current = newH;
      setCaptionH(newH);
    }
  };

  const cancelLong = () => { if (longPressRef.current) clearTimeout(longPressRef.current); };

  const onPtrDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    longPressPos.current = { x: e.clientX, y: e.clientY };
    longPressRef.current = setTimeout(() => setMenu(longPressPos.current), 500);
  };

  // Resize handlers
  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeDragRef.current = { startX: e.clientX, startW: localWidthRef.current };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeDragRef.current) return;
    const zoom = useStore.getState().canvasTransform.zoom;
    const dx = (e.clientX - resizeDragRef.current.startX) / zoom;
    const newW = Math.max(PHOTO_CARD_MIN_W, resizeDragRef.current.startW + dx);
    localWidthRef.current = newW;
    setLocalWidth(newW);
  };

  const handleResizeUp = () => {
    if (!resizeDragRef.current) return;
    onEditCard({ cardWidth: card.cardWidth }, { cardWidth: localWidthRef.current });
    resizeDragRef.current = null;
  };

  return (
    <>
      <motion.g
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
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
        {/* White polaroid card body */}
        <rect
          x={0} y={0}
          width={cardW} height={totalH}
          rx={8}
          fill="white"
          stroke={hovered ? '#a78bfa' : '#e5e7eb'}
          strokeWidth={hovered ? 2 : 1.5}
          style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.13))' }}
        />

        {/* Title strip */}
        <rect x={0} y={0} width={cardW} height={TITLE_H} rx={8} fill={colour} />
        <rect x={0} y={TITLE_H - 8} width={cardW} height={8} fill={colour} />

        {/* Title foreignObject */}
        <foreignObject x={8} y={0} width={cardW - 16} height={TITLE_H} style={{ overflow: 'visible' }}>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={() => { onEditCard({ title: card.title }, { title: titleDraft }); setEditingTitle(false); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLElement).blur(); }}
              onPointerDown={e => e.stopPropagation()}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui', color: '#1f2937', height: '100%' }}
            />
          ) : (
            <div
              onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); setTitleDraft(card.title); }}
              onPointerDown={e => e.stopPropagation()}
              style={{ fontSize: 12, fontWeight: 600, fontFamily: 'system-ui', color: '#1f2937', userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', height: '100%', display: 'flex', alignItems: 'center' }}
            >
              {card.title || <span style={{ color: '#9ca3af', fontWeight: 400 }}>Photo title…</span>}
            </div>
          )}
        </foreignObject>

        {/* Photo image */}
        <image
          x={SIDE_PAD}
          y={TITLE_H + TOP_PAD}
          width={cardW - 2 * SIDE_PAD}
          height={imageH}
          href={card.imageDataUrl ?? ''}
          preserveAspectRatio="xMidYMid slice"
          style={{ borderRadius: 0 }}
        />

        {/* Caption foreignObject */}
        <foreignObject
          x={SIDE_PAD}
          y={TITLE_H + TOP_PAD + imageH + BOT_PAD}
          width={cardW - 2 * SIDE_PAD}
          height={captionH}
          style={{ overflow: 'visible' }}
        >
          <textarea
            ref={captionRef}
            defaultValue={card.caption}
            onInput={autoResizeCaption}
            onBlur={e => {
              const text = (e.target as HTMLTextAreaElement).value;
              if (text !== card.caption) {
                onEditCard({ caption: card.caption }, { caption: text });
              }
            }}
            onPointerDown={e => e.stopPropagation()}
            placeholder="Add a caption…"
            style={{
              width: '100%',
              minHeight: 32,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 11,
              fontFamily: 'system-ui',
              color: '#6b7280',
              resize: 'none',
              overflow: 'hidden',
              lineHeight: 1.5,
              padding: 0,
            }}
          />
        </foreignObject>

        {/* Resize grip at bottom-right */}
        <g
          style={{ cursor: 'se-resize' }}
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onPointerCancel={handleResizeUp}
        >
          <rect x={cardW - 16} y={totalH - 16} width={16} height={16} fill="transparent" />
          {/* 3-dot grip */}
          <circle cx={cardW - 4} cy={totalH - 4} r={1.5} fill="#9ca3af" />
          <circle cx={cardW - 9} cy={totalH - 4} r={1.5} fill="#9ca3af" />
          <circle cx={cardW - 4} cy={totalH - 9} r={1.5} fill="#9ca3af" />
        </g>

        {/* Comment expand arrow — right side of card */}
        <ExpandArrow
          expanded={commentsOpen}
          cx={cardW + 30}
          cy={totalH / 2}
          onClick={() => setCommentsOpen(v => !v)}
          tooltipCollapsed={`${comments.length} comment${comments.length !== 1 ? 's' : ''} — click to open`}
          tooltipExpanded="Click to close comments"
        />

        {/* Comment count badge */}
        {comments.length > 0 && !commentsOpen && (
          <g style={{ pointerEvents: 'none' }}>
            <circle cx={cardW + 38} cy={totalH / 2 - 10} r={7} fill="#6366f1" />
            <text x={cardW + 38} y={totalH / 2 - 10} textAnchor="middle" dominantBaseline="middle"
              fontSize={8} fontWeight="700" fill="white" fontFamily="system-ui" style={{ userSelect: 'none' }}>
              {comments.length > 9 ? '9+' : comments.length}
            </text>
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
                  {
                    icon: '🖼️',
                    label: 'Replace Photo',
                    onClick: () => {
                      pickImageFile(({ dataUrl, aspectRatio: ar }) => {
                        onEditCard(
                          { imageDataUrl: card.imageDataUrl, imageAspectRatio: card.imageAspectRatio },
                          { imageDataUrl: dataUrl, imageAspectRatio: ar },
                        );
                      });
                    },
                  },
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

      {/* Comment panel portal */}
      {commentsOpen && (
        <CommentPanelPortal
          svgRef={svgRef}
          canvasX={cardCanvasX + cardW + 40}
          canvasY={cardCanvasY}
          comments={comments}
          onAdd={onAddComment}
          onDelete={onDeleteComment}
          onEdit={onEditComment}
        />
      )}
    </>
  );
});
