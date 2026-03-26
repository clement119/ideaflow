import type { INode } from '../../store/types';

interface Props {
  node: INode;
  selected: boolean;
}

export function NodeIdea({ node, selected }: Props) {
  const cx = node.width / 2;
  const cy = node.height / 2;
  const rx = node.width / 2;
  const ry = node.height / 2;

  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={node.colour}
      stroke={selected ? '#6366f1' : '#a78bfa'}
      strokeWidth={selected ? 2 : 1.5}
      style={{ filter: selected ? 'drop-shadow(0 0 6px rgba(99,102,241,0.3))' : undefined }}
    />
  );
}
