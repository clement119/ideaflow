import { useEffect } from 'react';
import { useStore } from '../store/store';
import {
  DeleteNodeCommand, DeleteEdgeCommand, DuplicateNodeCommand
} from '../store/commands';
import { fitToViewport } from '../utils/viewport';
import { newId } from '../utils/ids';

export function useKeyboard() {
  const store = useStore;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea';

      // Space: pan mode
      if (e.key === ' ' && !isInput) {
        e.preventDefault();
        const current = store.getState().cursorMode;
        if (current === 'idle') store.getState().setCursorMode('pan-idle');
      }

      if (isInput) return; // don't intercept text inputs below

      // Undo / Redo
      if (meta && e.shiftKey && e.key === 'z') { e.preventDefault(); store.getState().redo(); return; }
      if (meta && e.key === 'z') { e.preventDefault(); store.getState().undo(); return; }

      // Select all
      if (meta && e.key === 'a') {
        e.preventDefault();
        const nodes = store.getState().nodes;
        store.getState().setSelection({ nodeIds: Object.keys(nodes), edgeIds: [], clusterId: null });
        return;
      }

      // Duplicate
      if (meta && e.key === 'd') {
        e.preventDefault();
        const { selection, nodes } = store.getState();
        selection.nodeIds.forEach(id => {
          const node = nodes[id];
          if (!node) return;
          const copy = { ...node, id: newId(), x: node.x + 20, y: node.y + 20 };
          store.getState().execute(new DuplicateNodeCommand(node, copy));
        });
        return;
      }

      // Fit to view
      if (meta && e.key === '0') {
        e.preventDefault();
        const nodes = Object.values(store.getState().nodes);
        if (!nodes.length) return;
        const t = fitToViewport(nodes, window.innerWidth, window.innerHeight);
        store.getState().setCanvasTransform(t);
        return;
      }

      // Delete selected
      if ((e.key === 'Backspace' || e.key === 'Delete') && !isInput) {
        e.preventDefault();
        const { selection, nodes, edges } = store.getState();
        selection.nodeIds.forEach(id => {
          if (nodes[id]) store.getState().execute(new DeleteNodeCommand(id, nodes[id]));
        });
        selection.edgeIds.forEach(id => {
          if (edges[id]) store.getState().execute(new DeleteEdgeCommand(id, edges[id]));
        });
        store.getState().clearSelection();
        store.getState().setCursorMode('idle');
        return;
      }

      // Toggle minimap with M
      if (e.key === 'm' && !meta) {
        store.getState().toggleMinimap();
        return;
      }

      // Toggle background
      if (e.key === 'g' && !meta) {
        const current = store.getState().backgroundStyle;
        store.getState().setBackgroundStyle(current === 'grid' ? 'plain' : 'grid');
        return;
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        const current = store.getState().cursorMode;
        if (current === 'pan-idle' || current === 'pan-drag') {
          store.getState().setCursorMode('idle');
        }
      }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
}
