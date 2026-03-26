import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';

export function EmptyState() {
  const nodes = useStore(s => s.nodes);
  const isEmpty = Object.keys(nodes).length === 0;

  return (
    <AnimatePresence>
      {isEmpty && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            {/* Animated cursor illustration */}
            <motion.div
              animate={{ x: [0, 12, -8, 0], y: [0, -8, 6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32">
                <line x1="16" y1="4" x2="16" y2="28" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="4" y1="16" x2="28" y2="16" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="2.5" fill="#9ca3af"/>
              </svg>
            </motion.div>
            <p style={{ fontSize: 18, color: '#9ca3af', margin: 0, fontFamily: 'system-ui', fontWeight: 400 }}>
              Double-click anywhere to start
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
