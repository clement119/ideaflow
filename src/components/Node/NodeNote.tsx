import { motion } from 'framer-motion';
import type { INode } from '../../store/types';
import { useIsMobile } from '../../hooks/useMobile';

interface Props {
  node: INode;
  selected: boolean;
  hovered: boolean;
}

export function NodeNote({ node, selected, hovered }: Props) {
  const isMobile = useIsMobile();
  const breathe = hovered && !selected && !isMobile;
  const foldSize = 10;
  const w = node.width;
  const h = node.height;

  return (
    <motion.path
      d={`M 0,0 L ${w - foldSize},0 L ${w},${foldSize} L ${w},${h} L 0,${h} Z`}
      fill={node.colour}
      animate={
        selected
          ? { strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.35))' }
          : breathe
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
      stroke={selected ? '#6366f1' : '#86efac'}
      transition={
        breathe
          ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
          : { duration: 0.25 }
      }
    />
  );
}
