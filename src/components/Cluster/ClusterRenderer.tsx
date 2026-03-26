import { useStore } from '../../store/store';
import { ClusterExpanded } from './ClusterExpanded';
import { ClusterCollapsed } from './ClusterCollapsed';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export function ClusterRenderer({ svgRef: _ }: Props) {
  const clusters = useStore(s => s.clusters);

  return (
    <g>
      {Object.values(clusters).map(cluster =>
        cluster.isCollapsed
          ? <ClusterCollapsed key={cluster.id} cluster={cluster} />
          : <ClusterExpanded key={cluster.id} cluster={cluster} />
      )}
    </g>
  );
}
