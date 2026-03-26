import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';

const HINTS = [
  { key: 'first-node',       trigger: (nodeCount: number) => nodeCount === 1,  text: 'Drag from the ● handle on a node to connect' },
  { key: 'first-connection', trigger: (_nodeCount: number, edgeCount: number) => edgeCount === 1, text: 'Select 2+ nodes and right-click to group them' },
  { key: 'first-cluster',    trigger: (_n: number, _e: number, clusterCount: number) => clusterCount === 1, text: 'Click ▼ on a cluster to collapse it' },
] as const;

export function HintTooltip() {
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const clusters = useStore(s => s.clusters);
  const hints = useStore(s => s.hints);
  const markHintShown = useStore(s => s.markHintShown);
  const incrementInteraction = useStore(s => s.incrementInteraction);

  const nodeCount = Object.keys(nodes).length;
  const edgeCount = Object.keys(edges).length;
  const clusterCount = Object.keys(clusters).length;

  // Increment interaction count on node creation
  useEffect(() => {
    if (nodeCount > 0) incrementInteraction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeCount]);

  if (hints.interactionCount >= 5) return null;

  const activeHint = HINTS.find(h =>
    !hints.shown.includes(h.key) &&
    h.trigger(nodeCount, edgeCount, clusterCount)
  );

  return (
    <AnimatePresence>
      {activeHint && (
        <motion.div
          key={activeHint.key}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={() => {
            setTimeout(() => markHintShown(activeHint.key), 3000);
          }}
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(99,102,241,0.92)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontFamily: 'system-ui',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            zIndex: 2000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {activeHint.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
