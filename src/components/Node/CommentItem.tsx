import { useState } from 'react';
import type { IComment } from '../../store/types';

interface Props {
  comment: IComment;
  onDelete: () => void;
  onEdit: (newText: string) => void;
}

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function avatarColour(text: string): string {
  const palette = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

export function CommentItem({ comment, onDelete, onEdit }: Props) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const initials = comment.text.slice(0, 1).toUpperCase() || '?';
  const bg = avatarColour(comment.text);

  const confirm = () => {
    if (draft.trim()) onEdit(draft.trim());
    setEditing(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 8,
        background: hovered ? '#f5f3ff' : 'transparent',
        transition: 'background 0.15s',
        position: 'relative',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: bg, color: 'white',
        fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui', flexShrink: 0, marginTop: 1,
      }}>
        {initials}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={confirm}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirm(); }
              if (e.key === 'Escape') { setDraft(comment.text); setEditing(false); }
            }}
            style={{
              width: '100%', border: '1px solid #6366f1', borderRadius: 5,
              fontSize: 11, fontFamily: 'system-ui', padding: '2px 4px',
              resize: 'none', outline: 'none', lineHeight: 1.4,
            }}
            rows={2}
          />
        ) : (
          <div
            onDoubleClick={() => setEditing(true)}
            style={{
              fontSize: 11, fontFamily: 'system-ui', color: '#374151',
              lineHeight: 1.45, wordBreak: 'break-word',
            }}
          >
            {comment.text}
          </div>
        )}
        <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'system-ui', marginTop: 2 }}>
          {timeAgo(comment.createdAt)}
        </div>
      </div>

      {/* Delete button */}
      {hovered && !editing && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{
            position: 'absolute', top: 5, right: 6,
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, color: '#9ca3af', padding: 2, lineHeight: 1,
          }}
        >×</button>
      )}
    </div>
  );
}
