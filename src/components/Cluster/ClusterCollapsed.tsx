import type { ICluster } from '../../store/types';
import { useStore } from '../../store/store';
import { CollapseClusterCommand } from '../../store/commands';
import { computeCentroid } from '../../utils/geometry';

interface Props {
  cluster: ICluster;
}

export function ClusterCollapsed({ cluster }: Props) {
  const nodes = useStore(s => s.nodes);
  const execute = useStore(s => s.execute);
  const selectCluster = useStore(s => s.selectCluster);

  const expand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const centroid = computeCentroid(cluster.memberNodeIds, nodes);
    // Restore previous positions (stored in cluster.x/y as rough centroid)
    const prevPositions: Record<string, { x: number; y: number }> = {};
    cluster.memberNodeIds.forEach((id, i) => {
      const angle = (i / cluster.memberNodeIds.length) * Math.PI * 2;
      const r = 120;
      prevPositions[id] = {
        x: cluster.x + Math.cos(angle) * r - 60,
        y: cluster.y + Math.sin(angle) * r - 20,
      };
    });
    execute(new CollapseClusterCommand(cluster.id, false, prevPositions, centroid));
  };

  const count = cluster.memberNodeIds.length;
  const w = 140;
  const h = 44;

  return (
    <g
      transform={`translate(${cluster.x - w / 2}, ${cluster.y - h / 2})`}
      onClick={e => { e.stopPropagation(); selectCluster(cluster.id); }}
      onDoubleClick={expand}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={0} y={0} width={w} height={h} rx={h / 2}
        fill={cluster.colour}
        stroke="#a78bfa"
        strokeWidth={1.5}
      />
      <text
        x={w / 2 - 12} y={h / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={12} fill="#374151" fontFamily="system-ui"
      >
        {cluster.label}
      </text>
      {/* Count badge */}
      <circle cx={w - 16} cy={h / 2} r={11} fill="#7c3aed" />
      <text
        x={w - 16} y={h / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fill="white" fontFamily="system-ui" fontWeight="600"
      >
        {count}
      </text>
      {/* Expand icon */}
      <text
        x={w - 36} y={h / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={12} fill="#7c3aed"
        onClick={expand}
      >
        ▶
      </text>
    </g>
  );
}
