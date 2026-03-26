import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ICluster } from '../../store/types';
import { useStore } from '../../store/store';
import { CollapseClusterCommand } from '../../store/commands';
import { computeBoundingBox, computeCentroid } from '../../utils/geometry';

interface Props {
  cluster: ICluster;
}

export function ClusterExpanded({ cluster }: Props) {
  const nodes = useStore(s => s.nodes);
  const execute = useStore(s => s.execute);
  const selectCluster = useStore(s => s.selectCluster);
  const transform = useStore(s => s.canvasTransform);

  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const didDrag = useRef(false);

  const memberNodes = cluster.memberNodeIds.map(id => nodes[id]).filter(Boolean);
  const bbox = computeBoundingBox(cluster.memberNodeIds, nodes, 24);
  const centroid = computeCentroid(cluster.memberNodeIds, nodes);

  const collapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevPositions: Record<string, { x: number; y: number }> = {};
    cluster.memberNodeIds.forEach(id => {
      if (nodes[id]) prevPositions[id] = { x: nodes[id].x, y: nodes[id].y };
    });
    execute(new CollapseClusterCommand(cluster.id, true, prevPositions, centroid));
    // Update cluster anchor to centroid
    useStore.setState(s => ({
      clusters: { ...s.clusters, [cluster.id]: { ...s.clusters[cluster.id], x: centroid.x, y: centroid.y } },
    }));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    // Only drag on the border/header area — check it's not hitting inner nodes
    const targetTag = (e.target as SVGElement).tagName;
    if (targetTag === 'rect' && (e.target as SVGElement).getAttribute('data-cluster-bg')) {
      dragRef.current = { startX: e.clientX, startY: e.clientY };
      didDrag.current = false;
      (e.target as SVGElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / transform.zoom;
    const dy = (e.clientY - dragRef.current.startY) / transform.zoom;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag.current = true;

    if (didDrag.current) {
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      // Move cluster and all member nodes
      const nodes = useStore.getState().nodes;
      const updated = { ...nodes };
      cluster.memberNodeIds.forEach(id => {
        if (updated[id]) updated[id] = { ...updated[id], x: updated[id].x + dx, y: updated[id].y + dy };
      });
      useStore.setState(s => ({
        nodes: updated,
        clusters: { ...s.clusters, [cluster.id]: { ...s.clusters[cluster.id], x: cluster.x + dx, y: cluster.y + dy } },
      }));
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <g onClick={e => { e.stopPropagation(); selectCluster(cluster.id); }}>
      {/* Cluster bounding box */}
      <rect
        data-cluster-bg="true"
        x={bbox.x}
        y={bbox.y}
        width={bbox.width}
        height={bbox.height}
        rx={12}
        fill={cluster.colour}
        stroke="#c4b5fd"
        strokeWidth={1.5}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: 'move' }}
      />

      {/* Cluster header */}
      <text
        x={bbox.x + 10}
        y={bbox.y + 16}
        fontSize={11}
        fill="#7c3aed"
        fontFamily="system-ui"
        fontWeight="600"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {cluster.label}
      </text>

      {/* Collapse button */}
      <text
        x={bbox.x + bbox.width - 16}
        y={bbox.y + 16}
        fontSize={12}
        fill="#7c3aed"
        style={{ cursor: 'pointer' }}
        onClick={collapse}
      >
        ▼
      </text>

      {/* Animated member nodes bloom */}
      <AnimatePresence>
        {memberNodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ x: centroid.x - node.width / 2, y: centroid.y - node.height / 2, scale: 0, opacity: 0 }}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            exit={{ x: centroid.x - node.x - node.width / 2, y: centroid.y - node.y - node.height / 2, scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.04 }}
            style={{ transformOrigin: `${node.x + node.width / 2}px ${node.y + node.height / 2}px` }}
          />
        ))}
      </AnimatePresence>
    </g>
  );
}
