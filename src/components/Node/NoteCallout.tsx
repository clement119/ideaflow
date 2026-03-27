import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  note: string;
  cx: number;      // centre x in local coords (node.width/2 for nodes, 0 for edges)
  onSave: (newNote: string, oldNote: string) => void;
  onHide: () => void;
}

export function NoteCallout({ note, cx, onSave, onHide }: Props) {
  const [draft, setDraft] = useState(note);

  const boxW = 168;
  const boxH = 76;
  const boxX = cx - boxW / 2;
  const boxY = -boxH - 24;
  const tailY = boxY + boxH;

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
      {/* Seam cover */}
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
    </motion.g>
  );
}
