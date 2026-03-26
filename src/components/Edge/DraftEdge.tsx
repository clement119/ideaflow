import { useStore } from '../../store/store';
import { routeEdgeToCursor } from '../../utils/geometry';

export function DraftEdge() {
  const draftEdge = useStore(s => s.draftEdge);
  const nodes = useStore(s => s.nodes);

  if (!draftEdge) return null;

  const source = nodes[draftEdge.sourceId];
  if (!source) return null;

  const bezier = routeEdgeToCursor(
    { x: source.x, y: source.y, width: source.width, height: source.height },
    { x: draftEdge.x, y: draftEdge.y }
  );

  return (
    <path
      d={bezier.d}
      fill="none"
      stroke="#6366f1"
      strokeWidth={1.5}
      strokeDasharray="6 3"
      opacity={0.7}
      style={{ pointerEvents: 'none' }}
    />
  );
}
