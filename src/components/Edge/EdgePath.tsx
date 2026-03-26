import { useState } from 'react';
import { useStore } from '../../store/store';
import type { IEdge } from '../../store/types';
import { EditEdgeCommand } from '../../store/commands';
import type { BezierResult } from '../../utils/geometry';

interface Props {
  edge: IEdge;
  bezier: BezierResult;
}

export function EdgePath({ edge, bezier }: Props) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(edge.label ?? '');

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

  return (
    <g>
      {/* Invisible wide path for hit-testing */}
      <path
        d={bezier.d}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); selectEdge(edge.id); }}
      />
      {/* Visible path */}
      <path
        d={bezier.d}
        fill="none"
        stroke={isSelected ? '#6366f1' : '#9ca3af'}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={edge.style === 'dashed' ? '6 4' : undefined}
        markerEnd={`url(#arrow-${isSelected ? 'selected' : 'default'})`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Edge label */}
      {edge.label && !editingLabel && (
        <g
          transform={`translate(${bezier.midpoint.x}, ${bezier.midpoint.y})`}
          style={{ cursor: 'text' }}
          onDoubleClick={e => { e.stopPropagation(); setEditingLabel(true); setLabelDraft(edge.label ?? ''); }}
        >
          <rect x={-24} y={-10} width={48} height={20} rx={10} fill="white" stroke="#e5e7eb" strokeWidth={1} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#6b7280" fontFamily="system-ui">
            {edge.label}
          </text>
        </g>
      )}

      {/* Click midpoint to add label */}
      {!edge.label && isSelected && !editingLabel && (
        <circle
          cx={bezier.midpoint.x}
          cy={bezier.midpoint.y}
          r={6}
          fill="white"
          stroke="#6366f1"
          strokeWidth={1.5}
          style={{ cursor: 'text' }}
          onClick={e => { e.stopPropagation(); setEditingLabel(true); setLabelDraft(''); }}
        />
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
    </g>
  );
}
