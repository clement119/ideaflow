import { createPortal } from 'react-dom';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';
import { canvasToScreen } from '../../utils/viewport';
import { computeBoundingBox } from '../../utils/geometry';
import {
  DeleteNodeCommand, EditNodeCommand, DuplicateNodeCommand,
  DeleteEdgeCommand, EditEdgeCommand,
  DeleteClusterCommand, CreateClusterCommand,
  CollapseClusterCommand, AlignCommand
} from '../../store/commands';
import { newId } from '../../utils/ids';
import { NODE_COLOURS, CLUSTER_COLOURS, DEFAULT_CLUSTER_COLOUR } from '../../utils/colours';
import type { NodeType } from '../../store/types';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export function ContextualToolbar({ svgRef }: Props) {
  const selection = useStore(s => s.selection);
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const clusters = useStore(s => s.clusters);
  const transform = useStore(s => s.canvasTransform);
  const cursorMode = useStore(s => s.cursorMode);
  const execute = useStore(s => s.execute);
  const clearSelection = useStore(s => s.clearSelection);
  const setSelection = useStore(s => s.setSelection);

  const { nodeIds, edgeIds, clusterId } = selection;
  const hasSelection = nodeIds.length > 0 || edgeIds.length > 0 || clusterId !== null;

  // Drag-to-reposition state
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [userOffset, setUserOffset] = useState({ x: 0, y: 0 });
  const selectionKey = [...nodeIds, ...edgeIds, clusterId ?? ''].join(',');
  useEffect(() => { setUserOffset({ x: 0, y: 0 }); }, [selectionKey]);

  const handleDragPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: userOffset.x, originY: userOffset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleDragPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setUserOffset({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
    });
  };
  const handleDragPointerUp = () => { dragRef.current = null; };

  if (!hasSelection || !svgRef.current || cursorMode === 'drag-node') return null;

  const svgRect = svgRef.current.getBoundingClientRect();

  // Compute toolbar position
  let toolbarX = 0, toolbarY = 0;
  if (nodeIds.length > 0) {
    const bbox = computeBoundingBox(nodeIds, nodes);
    const screen = canvasToScreen(bbox.x + bbox.width / 2, bbox.y - 12, transform, svgRect);
    toolbarX = screen.x;
    toolbarY = screen.y;
  } else if (edgeIds.length > 0) {
    const edge = edges[edgeIds[0]];
    if (edge) {
      const src = nodes[edge.sourceId];
      if (src) {
        const screen = canvasToScreen(src.x + src.width / 2, src.y - 12, transform, svgRect);
        toolbarX = screen.x;
        toolbarY = screen.y;
      }
    }
  } else if (clusterId) {
    const cluster = clusters[clusterId];
    if (cluster) {
      const screen = canvasToScreen(cluster.x, cluster.y - 40, transform, svgRect);
      toolbarX = screen.x;
      toolbarY = screen.y;
    }
  }

  // Clamp to viewport
  toolbarX = Math.max(80, Math.min(window.innerWidth - 80, toolbarX));
  toolbarY = Math.max(60, toolbarY);

  const btn = (label: string, onClick: () => void, variant: 'default' | 'danger' = 'default') => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        fontFamily: 'system-ui',
        border: 'none',
        borderRadius: 6,
        background: variant === 'danger' ? '#fee2e2' : '#f3f4f6',
        color: variant === 'danger' ? '#dc2626' : '#374151',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );

  let content: React.ReactNode = null;

  // ── Single node ──────────────────────────────────────────────────────────
  if (nodeIds.length === 1) {
    const node = nodes[nodeIds[0]];
    if (!node) return null;

    content = (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', maxWidth: 320 }}>
        {/* Colour swatches */}
        {NODE_COLOURS.map(c => (
          <div
            key={c}
            onClick={() => execute(new EditNodeCommand(node.id, { colour: node.colour }, { colour: c }))}
            style={{
              width: 18, height: 18, borderRadius: '50%', background: c,
              border: node.colour === c ? '2px solid #6366f1' : '1.5px solid #d1d5db',
              cursor: 'pointer', flexShrink: 0,
            }}
          />
        ))}
        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
        {/* Type switcher */}
        {(['default', 'idea', 'note'] as NodeType[]).map(t => (
          btn(t, () => execute(new EditNodeCommand(node.id, { type: node.type }, { type: t })))
        ))}
        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
        {btn('⊕ Dup', () => {
          const copy = { ...node, id: newId(), x: node.x + 20, y: node.y + 20 };
          execute(new DuplicateNodeCommand(node, copy));
          setSelection({ nodeIds: [copy.id], edgeIds: [], clusterId: null });
        })}
        {btn('✕ Del', () => { execute(new DeleteNodeCommand(node.id, node)); clearSelection(); }, 'danger')}
      </div>
    );
  }

  // ── Single edge ──────────────────────────────────────────────────────────
  else if (edgeIds.length === 1) {
    const edge = edges[edgeIds[0]];
    if (!edge) return null;

    content = (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {btn(edge.style === 'solid' ? '— Solid' : '- - Dashed', () =>
          execute(new EditEdgeCommand(edge.id, { style: edge.style }, { style: edge.style === 'solid' ? 'dashed' : 'solid' }))
        )}
        {btn('✕ Del', () => { execute(new DeleteEdgeCommand(edge.id, edge)); clearSelection(); }, 'danger')}
      </div>
    );
  }

  // ── Cluster ──────────────────────────────────────────────────────────────
  else if (clusterId) {
    const cluster = clusters[clusterId];
    if (!cluster) return null;

    content = (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {btn(cluster.isCollapsed ? '▶ Expand' : '▼ Collapse', () => {
          const nodes = useStore.getState().nodes;
          const centroid = { x: cluster.x, y: cluster.y };
          const prevPositions: Record<string, { x: number; y: number }> = {};
          cluster.memberNodeIds.forEach(id => {
            if (nodes[id]) prevPositions[id] = { x: nodes[id].x, y: nodes[id].y };
          });
          execute(new CollapseClusterCommand(cluster.id, !cluster.isCollapsed, prevPositions, centroid));
        })}
        {CLUSTER_COLOURS.slice(0, 4).map(c => (
          <div
            key={c}
            onClick={() => useStore.setState(s => ({
              clusters: { ...s.clusters, [clusterId]: { ...s.clusters[clusterId], colour: c } }
            }))}
            style={{
              width: 18, height: 18, borderRadius: '50%', background: c.replace('0.18', '0.6'),
              border: cluster.colour === c ? '2px solid #6366f1' : '1.5px solid #d1d5db',
              cursor: 'pointer',
            }}
          />
        ))}
        {btn('✕ Del', () => { execute(new DeleteClusterCommand(clusterId, cluster)); clearSelection(); }, 'danger')}
      </div>
    );
  }

  // ── Multi-select ─────────────────────────────────────────────────────────
  else if (nodeIds.length > 1) {
    content = (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {btn('⬡ Group', () => {
          const allNodes = useStore.getState().nodes;
          const bbox = computeBoundingBox(nodeIds, allNodes);
          const cluster = {
            id: newId(),
            label: 'Group',
            colour: DEFAULT_CLUSTER_COLOUR,
            memberNodeIds: nodeIds,
            isCollapsed: false,
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2,
          };
          execute(new CreateClusterCommand(cluster));
          setSelection({ nodeIds: [], edgeIds: [], clusterId: cluster.id });
        })}
        {btn('Align H', () => {
          const allNodes = useStore.getState().nodes;
          const avgY = nodeIds.reduce((s, id) => s + allNodes[id].y, 0) / nodeIds.length;
          const before: Record<string, { x: number; y: number }> = {};
          const after: Record<string, { x: number; y: number }> = {};
          nodeIds.forEach(id => {
            before[id] = { x: allNodes[id].x, y: allNodes[id].y };
            after[id] = { x: allNodes[id].x, y: avgY };
          });
          execute(new AlignCommand(nodeIds, 'horizontal', before, after));
        })}
        {btn('Align V', () => {
          const allNodes = useStore.getState().nodes;
          const avgX = nodeIds.reduce((s, id) => s + allNodes[id].x, 0) / nodeIds.length;
          const before: Record<string, { x: number; y: number }> = {};
          const after: Record<string, { x: number; y: number }> = {};
          nodeIds.forEach(id => {
            before[id] = { x: allNodes[id].x, y: allNodes[id].y };
            after[id] = { x: avgX, y: allNodes[id].y };
          });
          execute(new AlignCommand(nodeIds, 'vertical', before, after));
        })}
        {btn('✕ Del All', () => {
          nodeIds.forEach(id => execute(new DeleteNodeCommand(id, nodes[id])));
          clearSelection();
        }, 'danger')}
      </div>
    );
  }

  return createPortal(
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          key="toolbar"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            left: toolbarX + userOffset.x,
            top: toolbarY + userOffset.y,
            transform: 'translateX(-50%)',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '6px 8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Drag handle */}
          <div
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            style={{
              cursor: dragRef.current ? 'grabbing' : 'grab',
              padding: '0 2px',
              color: '#d1d5db',
              fontSize: 13,
              lineHeight: 1,
              userSelect: 'none',
              flexShrink: 0,
            }}
            title="Drag to reposition"
          >
            ⠿
          </div>
          <div style={{ width: 1, height: 20, background: '#e5e7eb', flexShrink: 0 }} />
          {content}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
