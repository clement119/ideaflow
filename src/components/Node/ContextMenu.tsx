import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export interface ContextMenuItem {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

export interface ContextMenuGroup {
  items: ContextMenuItem[];
}

interface Props {
  x: number;
  y: number;
  groups: ContextMenuGroup[];
  onClose: () => void;
}

export function ContextMenu({ x, y, groups, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Clamp to viewport
  const menuW = 178;
  const menuH = groups.reduce((h, g) => h + g.items.length * 34 + 9, 0);
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('keydown', key, true);
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1 }}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 5000,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 9,
        boxShadow: '0 8px 28px rgba(0,0,0,0.15)',
        minWidth: menuW,
        padding: '4px 0',
        transformOrigin: 'top left',
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
          )}
          {group.items.map(item => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '0 14px',
                height: 34,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                fontFamily: 'system-ui',
                color: item.danger ? '#dc2626' : '#1f2937',
                borderRadius: 5,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = item.danger ? '#fef2f2' : '#f0f0ff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'none';
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </motion.div>,
    document.body
  );
}
