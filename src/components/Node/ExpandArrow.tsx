import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

interface Props {
  expanded: boolean;
  cx: number;
  cy: number;
  onClick: (e: React.MouseEvent) => void;
  tooltipExpanded?: string;
  tooltipCollapsed?: string;
}

export function ExpandArrow({
  expanded, cx, cy, onClick,
  tooltipExpanded = 'Click to collapse',
  tooltipCollapsed = 'Click to expand',
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });

  return (
    <>
      <g
        onClick={e => { e.stopPropagation(); onClick(e); }}
        onPointerEnter={e => { setHovered(true); setScreenPos({ x: e.clientX, y: e.clientY }); }}
        onPointerMove={e => setScreenPos({ x: e.clientX, y: e.clientY })}
        onPointerLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={cx} cy={cy} r={12} fill="transparent" />
        <circle cx={cx} cy={cy} r={9}
          fill={hovered ? '#ede9fe' : 'white'}
          stroke="#c4b5fd" strokeWidth={1.5}
        />
        <motion.g
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        >
          <path
            d={`M ${cx - 4},${cy - 1.5} L ${cx},${cy + 2.5} L ${cx + 4},${cy - 1.5}`}
            fill="none" stroke="#7c3aed" strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </motion.g>
      </g>

      {/* Tooltip rendered outside SVG via portal */}
      {hovered && createPortal(
        <div style={{
          position: 'fixed',
          left: screenPos.x - 70,
          top: screenPos.y - 34,
          background: '#1f2937',
          color: 'white',
          fontSize: 10,
          fontFamily: 'system-ui',
          padding: '3px 8px',
          borderRadius: 5,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          {expanded ? tooltipExpanded : tooltipCollapsed}
        </div>,
        document.body
      )}
    </>
  );
}
