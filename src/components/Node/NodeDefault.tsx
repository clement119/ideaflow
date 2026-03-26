import type { INode } from '../../store/types';

interface Props {
  node: INode;
  selected: boolean;
}

export function NodeDefault({ node, selected }: Props) {
  return (
    <rect
      x={0}
      y={0}
      width={node.width}
      height={node.height}
      rx={node.height / 2}
      ry={node.height / 2}
      fill={node.colour}
      stroke={selected ? '#6366f1' : '#c4b5fd'}
      strokeWidth={selected ? 2 : 1.5}
      style={{ filter: selected ? 'drop-shadow(0 0 6px rgba(99,102,241,0.3))' : undefined }}
    />
  );
}
