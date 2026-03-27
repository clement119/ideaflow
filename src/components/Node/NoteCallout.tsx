import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/store';

interface Props {
  note: string;
  anchorX: number;    // fixed anchor point (tail tip) in local coords
  anchorY: number;
  onSave: (newNote: string, oldNote: string) => void;
  onHide: () => void;
  onSelect?: () => void;
}

const MIN_W = 120;
const MIN_H = 56;
const INIT_W = 168;
const INIT_H = 76;

/** Point on the edge of rect (bx,by,bw,bh) toward (ax,ay) from its centre */
function rectEdgePoint(bx: number, by: number, bw: number, bh: number, ax: number, ay: number) {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const dx = ax - cx;
  const dy = ay - cy;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: cx, y: by + bh };

  const eps = 1e-6;
  let tMin = Infinity;
  if (dx > eps) { const t = (bx + bw - cx) / dx; const y = cy + dy * t; if (y >= by && y <= by + bh) tMin = Math.min(tMin, t); }
  if (dx < -eps) { const t = (bx - cx) / dx; const y = cy + dy * t; if (y >= by && y <= by + bh) tMin = Math.min(tMin, t); }
  if (dy > eps) { const t = (by + bh - cy) / dy; const x = cx + dx * t; if (x >= bx && x <= bx + bw) tMin = Math.min(tMin, t); }
  if (dy < -eps) { const t = (by - cy) / dy; const x = cx + dx * t; if (x >= bx && x <= bx + bw) tMin = Math.min(tMin, t); }

  return tMin === Infinity ? { x: cx, y: by + bh } : { x: cx + dx * tMin, y: cy + dy * tMin };
}

export function NoteCallout({ note, anchorX, anchorY, onSave, onHide, onSelect }: Props) {
  const [draft, setDraft] = useState(note);
  // Box offset relative to default position (above anchor)
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [boxW, setBoxW] = useState(INIT_W);
  const [boxH, setBoxH] = useState(INIT_H);
  const zoom = useStore(s => s.canvasTransform.zoom);

  const boxX = anchorX + offsetX - boxW / 2;
  const boxY = anchorY - INIT_H - 24 + offsetY;   // grows downward on resize

  const dragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  const onDragDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offsetX, oy: offsetY };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffsetX(dragRef.current.ox + (e.clientX - dragRef.current.sx) / zoom);
    setOffsetY(dragRef.current.oy + (e.clientY - dragRef.current.sy) / zoom);
  };
  const onDragUp = () => { dragRef.current = null; };

  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, sw: boxW, sh: boxH };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = (e.clientX - resizeRef.current.sx) / zoom;
    const dy = (e.clientY - resizeRef.current.sy) / zoom;
    setBoxW(Math.max(MIN_W, resizeRef.current.sw + dx));
    setBoxH(Math.max(MIN_H, resizeRef.current.sh + dy));
  };
  const onResizeUp = () => { resizeRef.current = null; };

  // Dynamic connector from nearest box-edge point to anchor
  const ep = rectEdgePoint(boxX, boxY, boxW, boxH, anchorX, anchorY);
  const midX = (ep.x + anchorX) / 2;
  const midY = (ep.y + anchorY) / 2;
  const connPath = `M ${ep.x},${ep.y} Q ${midX},${midY} ${anchorX},${anchorY}`;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{ transformOrigin: `${anchorX}px ${anchorY}px` }}
    >
      {/* Connector — dashed line from box edge to anchor */}
      <path d={connPath} fill="none" stroke="#fde68a" strokeWidth={1.5} strokeDasharray="4 3" style={{ pointerEvents: 'none' }} />
      {/* Anchor dot */}
      <circle cx={anchorX} cy={anchorY} r={3} fill="#fbbf24" style={{ pointerEvents: 'none' }} />

      {/* Shadow */}
      <rect x={boxX + 1} y={boxY + 3} width={boxW} height={boxH} rx={8} fill="rgba(0,0,0,0.07)" style={{ pointerEvents: 'none' }} />

      {/* Body */}
      <rect
        x={boxX} y={boxY} width={boxW} height={boxH} rx={8}
        fill="#fffbeb" stroke="#fde68a" strokeWidth={1.5}
        onClick={e => { e.stopPropagation(); onSelect?.(); }}
      />

      {/* Drag handle strip */}
      <rect
        x={boxX + 2} y={boxY + 2} width={boxW - 4} height={18} rx={6}
        fill="#fef9c3"
        style={{ cursor: 'grab' }}
        onPointerDown={onDragDown}
        onPointerMove={onDragMove}
        onPointerUp={onDragUp}
        onPointerCancel={onDragUp}
        onClick={e => { e.stopPropagation(); onSelect?.(); }}
      />
      <text
        x={boxX + boxW / 2} y={boxY + 11}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fill="#a16207"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >⠿⠿⠿</text>

      {/* Hide (×) button */}
      <g onClick={e => { e.stopPropagation(); onHide(); }} style={{ cursor: 'pointer' }}>
        <circle cx={boxX + boxW - 8} cy={boxY + 11} r={8} fill="#fde68a" opacity={0.8} />
        <text x={boxX + boxW - 8} y={boxY + 11} textAnchor="middle" dominantBaseline="middle"
          fontSize={10} fill="#92400e" style={{ userSelect: 'none', pointerEvents: 'none' }}>×</text>
      </g>

      {/* Note textarea */}
      <foreignObject x={boxX + 8} y={boxY + 22} width={boxW - 16} height={boxH - 30}>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => onSave(draft, note)}
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onHide(); } }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onSelect?.(); }}
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

      {/* Resize handle — bottom-right */}
      <g
        style={{ cursor: 'nwse-resize' }}
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
      >
        <line x1={boxX + boxW - 11} y1={boxY + boxH - 2} x2={boxX + boxW - 2} y2={boxY + boxH - 11}
          stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={boxX + boxW - 6} y1={boxY + boxH - 2} x2={boxX + boxW - 2} y2={boxY + boxH - 6}
          stroke="#fbbf24" strokeWidth={1.5} strokeLinecap="round" />
        <rect x={boxX + boxW - 18} y={boxY + boxH - 18} width={18} height={18} fill="transparent" />
      </g>
    </motion.g>
  );
}
