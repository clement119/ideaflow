import { useStore } from '../../store/store';
import { routeEdge, resolveEndpointRect } from '../../utils/geometry';
import { EdgePath } from './EdgePath';
import { DraftEdge } from './DraftEdge';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export function EdgeRenderer({ svgRef: _ }: Props) {
  const edges = useStore(s => s.edges);
  const nodes = useStore(s => s.nodes);
  const clusters = useStore(s => s.clusters);

  return (
    <g>
      {/* Arrow markers */}
      <defs>
        <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 Z" fill="#9ca3af" />
        </marker>
        <marker id="arrow-selected" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 Z" fill="#6366f1" />
        </marker>
      </defs>

      {Object.values(edges).map(edge => {
        const sourceRect = resolveEndpointRect(edge.sourceId, nodes, clusters);
        const targetRect = resolveEndpointRect(edge.targetId, nodes, clusters);
        if (!sourceRect || !targetRect) return null;

        const bezier = routeEdge(sourceRect, targetRect);
        return <EdgePath key={edge.id} edge={edge} bezier={bezier} />;
      })}

      <DraftEdge />
    </g>
  );
}
