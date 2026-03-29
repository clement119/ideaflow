import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const SHORTCUTS = [
  { action: 'New node', keys: 'Double-click' },
  { action: 'Confirm edit', keys: 'Enter' },
  { action: 'Cancel', keys: 'Esc' },
  { action: 'Undo', keys: '⌘Z' },
  { action: 'Redo', keys: '⌘⇧Z' },
  { action: 'Select all', keys: '⌘A' },
  { action: 'Duplicate', keys: '⌘D' },
  { action: 'Fit to view', keys: '⌘0' },
  { action: 'Pan', keys: 'Space + drag' },
  { action: 'Delete', keys: '⌫' },
  { action: 'Shortcuts', keys: 'Ctrl+K' },
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
          }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, padding: '24px 32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              minWidth: 340,
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#111827', fontFamily: 'system-ui' }}>
              Keyboard Shortcuts
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui' }}>
              <tbody>
                {SHORTCUTS.map(s => (
                  <tr key={s.action}>
                    <td style={{ padding: '5px 0', fontSize: 13, color: '#374151' }}>{s.action}</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>
                      <kbd style={{
                        background: '#f3f4f6', border: '1px solid #d1d5db',
                        borderRadius: 4, padding: '2px 6px', fontSize: 12, color: '#6b7280',
                        fontFamily: 'monospace',
                      }}>
                        {s.keys}
                      </kbd>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ margin: '12px 0 0', fontSize: 12, color: '#9ca3af', fontFamily: 'system-ui' }}>
              Press Ctrl+K or Esc to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
