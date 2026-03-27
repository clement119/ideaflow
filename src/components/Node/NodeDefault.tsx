import { motion } from 'framer-motion';
import type { INode } from '../../store/types';

interface Props {
  node: INode;
  selected: boolean;
  hovered: boolean;
}

export function NodeDefault({ node, selected, hovered }: Props) {
  return (
    <motion.rect
      x={0}
      y={0}
      width={node.width}
      height={node.height}
      rx={12}
      fill={node.colour}
      animate={
        selected
          ? { strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.35))' }
          : hovered
          ? {
              strokeWidth: [1.5, 2.5, 1.5],
              filter: [
                'drop-shadow(0 0 2px rgba(99,102,241,0.15))',
                'drop-shadow(0 0 10px rgba(99,102,241,0.45))',
                'drop-shadow(0 0 2px rgba(99,102,241,0.15))',
              ],
            }
          : { strokeWidth: 1.5, filter: 'drop-shadow(0 0 0px rgba(99,102,241,0))' }
      }
      stroke={selected ? '#6366f1' : '#c4b5fd'}
      transition={
        hovered && !selected
          ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
          : { duration: 0.25 }
      }
    />
  );
}
