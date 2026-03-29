import { createPortal } from 'react-dom';
import { useStore } from '../../store/store';
import { canvasToScreen } from '../../utils/viewport';
import { CommentThread } from './CommentThread';
import type { IComment } from '../../store/types';

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** Canvas-space X of the panel's top-left corner */
  canvasX: number;
  /** Canvas-space Y of the panel's top-left corner */
  canvasY: number;
  comments: IComment[];
  onAdd: (c: IComment) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

/**
 * Renders the comment thread outside the SVG via a portal.
 * This avoids the Safari/WebKit bug where foreignObject HTML inside a
 * transformed <g> (world pan/zoom + node translate) renders at the wrong position.
 * Subscribes to canvasTransform only while the panel is open.
 */
export function CommentPanelPortal({
  svgRef, canvasX, canvasY, comments, onAdd, onDelete, onEdit,
}: Props) {
  // This subscription only runs while the panel is mounted (i.e. open)
  const transform = useStore(s => s.canvasTransform);
  const svgEl = svgRef.current;
  if (!svgEl) return null;

  const svgRect = svgEl.getBoundingClientRect();
  const screen = canvasToScreen(canvasX, canvasY, transform, svgRect);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: screen.x,
        top: screen.y,
        width: 220,
        zIndex: 2000,
      }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <CommentThread
        comments={comments}
        width={220}
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>,
    document.body
  );
}
