import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';
import type { IEdge } from '../../store/types';
import { EditEdgeCommand } from '../../store/commands';
import type { BezierResult } from '../../utils/geometry';
import { NoteCallout } from '../Node/NoteCallout';

interface Props {
  edge: IEdge;
  bezier: BezierResult;
}

export function EdgePath({ edge, bezier }: Props) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(edge.label ?? '');
  const [hovered, setHovered] = useState(false);

  const selection = useStore(s => s.selection);
  const selectEdge = useStore(s => s.selectEdge);
  const execute = useStore(s => s.execute);

  const isSelected = selection.edgeIds.includes(edge.id);

  const confirmLabel = () => {
    if (labelDraft !== (edge.label ?? '')) {
      execute(new EditEdgeCommand(edge.id, { label: edge.label }, { label: labelDraft || undefined }));
    }
    setEditingLabel(false);
  };

  const openLabelEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLabelDraft(edge.label ?? '');
    setEditingLabel(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    useStore.setState(s => ({
      edges: {
        ...s.edges,
        [edge.id]: {
          ...s.edges[edge.id],
          note: s.edges[edge.id].note ?? '',
          noteVisible: !(s.edges[edge.id].noteVisible ?? false),
        },
      },
    }));
  };

  return (
    <g>
      {/* Invisible wide hit path — click to select, double-click to edit label */}
      <path
        d={bezier.d}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); selectEdge(edge.id); }}
        onDoubleClick={openLabelEditor}
        onContextMenu={handleContextMenu}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      />

      {/* Visible animated path */}
      <motion.path
        d={bezier.d}
        fill="none"
        stroke={isSelected ? '#6366f1' : '#9ca3af'}
        strokeDasharray={edge.style === 'dashed' ? '6 4' : undefined}
        markerEnd={`url(#arrow-${isSelected ? 'selected' : 'default'})`}
        animate={
          isSelected
            ? { strokeWidth: 2, filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.4))' }
            : hovered
            ? {
                strokeWidth: [1.5, 2.5, 1.5],
                filter: [
                  'drop-shadow(0 0 0px rgba(99,102,241,0))',
                  'drop-shadow(0 0 6px rgba(99,102,241,0.4))',
                  'drop-shadow(0 0 0px rgba(99,102,241,0))',
                ],
              }
            : { strokeWidth: 1.5, filter: 'drop-shadow(0 0 0px rgba(99,102,241,0))' }
        }
        transition={
          hovered && !isSelected
            ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
        style={{ pointerEvents: 'none' }}
      />

      {/* Edge label (display) — double-click to edit */}
      {edge.label && !editingLabel && (
        <g
          transform={`translate(${bezier.midpoint.x}, ${bezier.midpoint.y})`}
          style={{ cursor: 'text' }}
          onDoubleClick={openLabelEditor}
        >
          <rect x={-24} y={-10} width={48} height={20} rx={10} fill="white" stroke="#e5e7eb" strokeWidth={1} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#6b7280" fontFamily="system-ui">
            {edge.label}
          </text>
        </g>
      )}

      {/* Label editor */}
      {editingLabel && (
        <foreignObject
          x={bezier.midpoint.x - 50}
          y={bezier.midpoint.y - 12}
          width={100}
          height={24}
        >
          <input
            autoFocus
            value={labelDraft}
            onChange={e => setLabelDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); confirmLabel(); }
              if (e.key === 'Escape') setEditingLabel(false);
            }}
            onBlur={confirmLabel}
            style={{
              width: '100%', height: '100%', border: '1px solid #6366f1',
              borderRadius: 12, textAlign: 'center', fontSize: 11,
              fontFamily: 'system-ui', outline: 'none', background: 'white',
              padding: '0 8px',
            }}
          />
        </foreignObject>
      )}

      {/* Note callout at edge midpoint */}
      <AnimatePresence>
        {edge.noteVisible && (
          <g transform={`translate(${bezier.midpoint.x}, ${bezier.midpoint.y})`}>
            <NoteCallout
              key="edge-callout"
              note={edge.note ?? ''}
              cx={0}
              onSave={(newNote, oldNote) => execute(new EditEdgeCommand(edge.id, { note: oldNote }, { note: newNote }))}
              onHide={() => useStore.setState(s => ({
                edges: { ...s.edges, [edge.id]: { ...s.edges[edge.id], noteVisible: false } },
              }))}
            />
          </g>
        )}
      </AnimatePresence>
    </g>
  );
}
