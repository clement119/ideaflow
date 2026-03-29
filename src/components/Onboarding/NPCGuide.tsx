import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const TIPS = [
  { icon: '✦', text: 'Double-click empty space to create a node' },
  { icon: '✦', text: 'Drag a handle on a node\'s edge to connect nodes' },
  { icon: '✦', text: 'Double-click a line to add a label' },
  { icon: '✦', text: 'Right-click any node to add cards or comments' },
  { icon: '✦', text: 'Scroll to zoom · Space + drag to pan' },
  { icon: '⌨', text: 'Press Ctrl+K to see all keyboard shortcuts' },
];

export function NPCGuide() {
  const [visible, setVisible] = useState(true);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 12,
            zIndex: 800,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
            pointerEvents: 'none',
          }}
        >
          {/* NPC character — half-body SVG */}
          <svg width={68} height={108} viewBox="0 0 68 108" style={{ flexShrink: 0, display: 'block' }}>
            {/* Body / shirt */}
            <path d="M 8,108 L 8,66 Q 8,58 16,56 L 26,54 Q 34,58 34,58 Q 34,58 42,54 L 52,56 Q 60,58 60,66 L 60,108 Z"
              fill="#6366f1" />
            {/* Collar */}
            <path d="M 24,56 L 34,66 L 44,56" fill="none" stroke="#4338ca" strokeWidth={2.5} strokeLinejoin="round" />
            {/* Neck */}
            <rect x={28} y={46} width={12} height={12} rx={5} fill="#f5c796" />
            {/* Head */}
            <circle cx={34} cy={34} r={22} fill="#f5c796" />
            {/* Hair */}
            <path d="M 12,28 Q 14,10 34,12 Q 54,10 56,28 Q 50,14 34,15 Q 18,14 12,28 Z" fill="#92400e" />
            {/* Left ear */}
            <ellipse cx={12.5} cy={34} rx={3} ry={4} fill="#f5c796" />
            {/* Right ear */}
            <ellipse cx={55.5} cy={34} rx={3} ry={4} fill="#f5c796" />
            {/* Eyes */}
            <ellipse cx={25} cy={32} rx={3.5} ry={4} fill="white" />
            <ellipse cx={43} cy={32} rx={3.5} ry={4} fill="white" />
            <circle cx={25.5} cy={33} r={2.2} fill="#374151" />
            <circle cx={43.5} cy={33} r={2.2} fill="#374151" />
            <circle cx={26.2} cy={31.8} r={0.9} fill="white" />
            <circle cx={44.2} cy={31.8} r={0.9} fill="white" />
            {/* Eyebrows */}
            <path d="M 21,26.5 Q 25,24.5 29,26.5" fill="none" stroke="#92400e" strokeWidth={1.5} strokeLinecap="round" />
            <path d="M 39,26.5 Q 43,24.5 47,26.5" fill="none" stroke="#92400e" strokeWidth={1.5} strokeLinecap="round" />
            {/* Smile */}
            <path d="M 25,42 Q 34,48 43,42" fill="none" stroke="#c2410c" strokeWidth={2} strokeLinecap="round" />
            {/* Cheeks */}
            <ellipse cx={18} cy={40} rx={4} ry={2.5} fill="#fca5a5" opacity={0.5} />
            <ellipse cx={50} cy={40} rx={4} ry={2.5} fill="#fca5a5" opacity={0.5} />
            {/* Left arm wave */}
            <path d="M 8,72 Q -4,64 2,54 Q 6,48 10,52" fill="none" stroke="#6366f1" strokeWidth={11} strokeLinecap="round" />
            {/* Hand */}
            <circle cx={10} cy={52} r={6} fill="#f5c796" />
          </svg>

          {/* Speech bubble */}
          <div style={{
            pointerEvents: 'auto',
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: 14,
            padding: '12px 14px 14px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
            maxWidth: 230,
            marginBottom: 18,
            position: 'relative',
          }}>
            {/* Bubble tail pointing down-left */}
            <div style={{
              position: 'absolute', bottom: -9, left: 20,
              width: 0, height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderTop: '9px solid #e5e7eb',
            }} />
            <div style={{
              position: 'absolute', bottom: -7, left: 21,
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid white',
            }} />

            {/* Close */}
            <button
              onClick={() => setVisible(false)}
              style={{
                position: 'absolute', top: 7, right: 8,
                border: 'none', background: 'none',
                cursor: 'pointer', fontSize: 15,
                color: '#9ca3af', lineHeight: 1, padding: 2,
                fontFamily: 'system-ui',
              }}
            >×</button>

            <div style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>
              Hi there! Here's how to get started:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {TIPS.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: '#6366f1', fontSize: 10, marginTop: 1, flexShrink: 0, fontFamily: 'system-ui' }}>
                    {tip.icon}
                  </span>
                  <span style={{ fontFamily: 'system-ui', fontSize: 11, color: '#374151', lineHeight: 1.45 }}>
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
