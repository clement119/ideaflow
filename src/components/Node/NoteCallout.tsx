import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/store';

interface Props {
  note: string;
  cx: number;      // centre x in local coords (node.width/2 for nodes, 0 for edges)
  onSave: (newNote: string, oldNote: string) => void;
  onHide: () => void;
}

const MIN_W = 120;
const MIN_H = 56;

export function NoteCallout({ note, cx, onSave, onHide }: Props) {
  const [draft, setDraft] = useState(note);
  const [boxW, setBoxW] = useState(168);
  const [boxH, setBoxH] = useState(76);
  const zoom = useStore(s => s.canvasTransform.zoom);

  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  // Tail tip is always at y=-24 (fixed anchor); box grows upward from there
  const tailY = -24;
  const boxY = tailY - boxH;
  const boxX = cx - boxW / 2;

  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: boxW, startH: boxH };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  };

  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = (e.clientX - resizeRef.current.startX) / zoom;
    const dy = (e.clientY - resizeRef.current.startY) / zoom;
    // Drag right = wider; drag up = taller (box grows upward, so Y is inverted)
    setBoxW(Math.max(MIN_W, resizeRef.current.startW + dx));
    setBoxH(Math.max(MIN_H, resizeRef.current.startH - dy));
  };

  const onResizeUp = () => { resizeRef.current = null; };

  return (
    <motion.g
      initial={{ opacity: 0, y: -6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{ transformOrigin: `${cx}px ${tailY + 8}px` }}
    >
      {/* Soft shadow */}
      <rect x={boxX + 1} y={boxY + 3} width={boxW} height={boxH} rx={8} fill="rgba(0,0,0,0.07)" />

      {/* Callout body */}
      <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={8} fill="#fffbeb" stroke="#fde68a" strokeWidth={1.5} />

      {/* Tail */}
      <path
        d={`M ${cx - 7},${tailY} L ${cx},${tailY + 12} L ${cx + 7},${tailY} Z`}
        fill="#fffbeb"
        stroke="#fde68a"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Seam cover — hides the stroke where tail meets box bottom */}
      <line x1={boxX + 1} y1={tailY} x2={boxX + boxW - 1} y2={tailY} stroke="#fffbeb" strokeWidth={2.5} />

      {/* Hide (×) button */}
      <g onClick={e => { e.stopPropagation(); onHide(); }} style={{ cursor: 'pointer' }}>
        <circle cx={boxX + boxW - 8} cy={boxY + 9} r={8} fill="#fde68a" opacity={0.7} />
        <text
          x={boxX + boxW - 8} y={boxY + 9}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={10} fill="#92400e"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >×</text>
      </g>

      {/* Editable note text */}
      <foreignObject x={boxX + 8} y={boxY + 8} width={boxW - 24} height={boxH - 18}>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => onSave(draft, note)}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); onHide(); }
          }}
          onPointerDown={e => e.stopPropagation()}
          placeholder="Add a note…"
          style={{
            width: '100%', height: '100%',
            border: 'none', outline: 'none', resize: 'none',
            background: 'transparent',
            fontSize: 11, fontFamily: 'system-ui, sans-serif',
            color: '#78350f', lineHeight: 1.5, padding: 0,
          }}
        />
      </foreignObject>

      {/* Resize handle — bottom-right corner, drag right/up to expand */}
      <g
        style={{ cursor: 'nwse-resize' }}
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
      >
        {/* Grip lines */}
        <line x1={boxX + boxW - 11} y1={tailY - 2} x2={boxX + boxW - 2} y2={tailY - 11} stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={boxX + boxW - 6} y1={tailY - 2} x2={boxX + boxW - 2} y2={tailY - 6} stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" />
        {/* Invisible hit area */}
        <rect x={boxX + boxW - 18} y={tailY - 18} width={18} height={18} fill="transparent" />
      </g>
    </motion.g>
  );
}
