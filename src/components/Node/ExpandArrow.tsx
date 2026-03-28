import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  expanded: boolean;
  cx: number;      // centre x in local SVG coords
  cy: number;      // centre y in local SVG coords
  onClick: (e: React.MouseEvent) => void;
  tooltipExpanded?: string;
  tooltipCollapsed?: string;
}

export function ExpandArrow({
  expanded,
  cx,
  cy,
  onClick,
  tooltipExpanded = 'Click to collapse',
  tooltipCollapsed = 'Click to expand',
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const onEnter = (e: React.PointerEvent) => {
    setHovered(true);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };
  const onMove = (e: React.PointerEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <g
      onClick={e => { e.stopPropagation(); onClick(e); }}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Hit circle */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" />

      {/* Visible button */}
      <circle
        cx={cx} cy={cy} r={9}
        fill={hovered ? '#ede9fe' : 'white'}
        stroke="#c4b5fd"
        strokeWidth={1.5}
      />

      {/* Chevron — rotates 180° when expanded */}
      <motion.g
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      >
        <path
          d={`M ${cx - 4},${cy - 1.5} L ${cx},${cy + 2.5} L ${cx + 4},${cy - 1.5}`}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Tooltip — rendered as an HTML fixed-position element via a foreign trick:
          we emit a data attribute and let a global CSS tooltip handle it,
          OR we use a simple SVG text that always faces up */}
      {hovered && (
        <foreignObject
          x={tooltipPos.x - cx - 60}
          y={tooltipPos.y - cy - 34}
          width={120}
          height={24}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div style={{
            position: 'fixed',
            left: tooltipPos.x - 60,
            top: tooltipPos.y - 36,
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
          </div>
        </foreignObject>
      )}
    </g>
  );
}
