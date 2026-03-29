import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentItem } from './CommentItem';
import type { IComment } from '../../store/types';
import { newId } from '../../utils/ids';

interface Props {
  comments: IComment[];
  width: number;           // px width to match parent card/node
  onAdd: (c: IComment) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export function CommentThread({ comments, width, onAdd, onDelete, onEdit }: Props) {
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd({ id: newId(), text, createdAt: Date.now() });
    setDraft('');
  };

  return (
    <div
      style={{ width, background: '#fafafa', borderRadius: 10, border: '1px solid #f0effe', overflow: 'visible' }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Comment list — scrollable when tall */}
      <div style={{ maxHeight: 260, overflowY: 'auto', overflowX: 'hidden' }}>
        <AnimatePresence initial={false}>
          {comments.map(c => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden' }}
            >
              <CommentItem
                comment={c}
                onDelete={() => onDelete(c.id)}
                onEdit={text => onEdit(c.id, text)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 8px', borderTop: comments.length ? '1px solid #f0effe' : 'none' }}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder="Add a comment…"
          rows={1}
          style={{
            flex: 1, border: '1px solid #e5e7eb', borderRadius: 6,
            fontSize: 11, fontFamily: 'system-ui', padding: '4px 6px',
            resize: 'none', outline: 'none', lineHeight: 1.4,
            background: 'white',
          }}
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          style={{
            border: 'none', borderRadius: 6, background: draft.trim() ? '#6366f1' : '#e5e7eb',
            color: draft.trim() ? 'white' : '#9ca3af',
            fontSize: 11, fontFamily: 'system-ui', cursor: draft.trim() ? 'pointer' : 'default',
            padding: '0 10px', flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
