import type { INode } from '../../store/types';

interface Props {
  node: INode;
  selected: boolean;
}

export function NodeNote({ node, selected }: Props) {
  const foldSize = 10;
  const w = node.width;
  const h = node.height;

  return (
    <path
      d={`M 0,0 L ${w - foldSize},0 L ${w},${foldSize} L ${w},${h} L 0,${h} Z`}
      fill={node.colour}
      stroke={selected ? '#6366f1' : '#86efac'}
      strokeWidth={selected ? 2 : 1.5}
      style={{ filter: selected ? 'drop-shadow(0 0 6px rgba(99,102,241,0.3))' : undefined }}
    />
  );
}
