import { create } from 'zustand';
import type { INode, IEdge, ICluster, CursorMode, CanvasTransform, HintsState, SelectionState } from './types';
import type { ICommand } from './commands';
import { saveCanvas, loadCanvas, saveHints, loadHints } from './persistence';

export interface CanvasStore {
  // Domain state
  nodes: Record<string, INode>;
  edges: Record<string, IEdge>;
  clusters: Record<string, ICluster>;

  // UI state
  selection: SelectionState;
  cursorMode: CursorMode;
  canvasTransform: CanvasTransform;
  backgroundStyle: 'grid' | 'plain';
  showMinimap: boolean;
  hints: HintsState;

  // Draft edge (while drawing)
  draftEdge: { sourceId: string; x: number; y: number } | null;

  // Undo / redo
  undoStack: ICommand[];
  redoStack: ICommand[];

  // Actions
  execute: (cmd: ICommand) => void;
  undo: () => void;
  redo: () => void;

  // Selection
  setSelection: (sel: SelectionState) => void;
  clearSelection: () => void;
  selectNode: (id: string) => void;
  toggleSelectNode: (id: string) => void;
  selectEdge: (id: string) => void;
  selectCluster: (id: string) => void;

  // Canvas
  setCursorMode: (mode: CursorMode) => void;
  setCanvasTransform: (t: CanvasTransform) => void;
  setBackgroundStyle: (s: 'grid' | 'plain') => void;
  toggleMinimap: () => void;
  setDraftEdge: (draft: { sourceId: string; x: number; y: number } | null) => void;

  // Hints
  markHintShown: (key: string) => void;
  incrementInteraction: () => void;
}

const saved = loadCanvas();
const savedHints = loadHints();

export const useStore = create<CanvasStore>((set, get) => ({
  nodes: saved?.nodes ?? {},
  edges: saved?.edges ?? {},
  clusters: saved?.clusters ?? {},

  selection: { nodeIds: [], edgeIds: [], clusterId: null },
  cursorMode: 'idle',
  canvasTransform: { x: 0, y: 0, zoom: 1 },
  backgroundStyle: 'grid',
  showMinimap: false,
  hints: savedHints ?? { shown: [], interactionCount: 0 },
  draftEdge: null,

  undoStack: [],
  redoStack: [],

  execute(cmd) {
    const state = get();
    const patch = cmd.execute({ nodes: state.nodes, edges: state.edges, clusters: state.clusters });
    set(s => ({
      ...patch,
      undoStack: [...s.undoStack, cmd],
      redoStack: [],
    }));
    const next = get();
    saveCanvas({ nodes: next.nodes, edges: next.edges, clusters: next.clusters });
  },

  undo() {
    const { undoStack } = get();
    if (!undoStack.length) return;
    const cmd = undoStack[undoStack.length - 1];
    const state = get();
    const patch = cmd.undo({ nodes: state.nodes, edges: state.edges, clusters: state.clusters });
    set(s => ({
      ...patch,
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, cmd],
    }));
    const next = get();
    saveCanvas({ nodes: next.nodes, edges: next.edges, clusters: next.clusters });
  },

  redo() {
    const { redoStack } = get();
    if (!redoStack.length) return;
    const cmd = redoStack[redoStack.length - 1];
    const state = get();
    const patch = cmd.execute({ nodes: state.nodes, edges: state.edges, clusters: state.clusters });
    set(s => ({
      ...patch,
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, cmd],
    }));
    const next = get();
    saveCanvas({ nodes: next.nodes, edges: next.edges, clusters: next.clusters });
  },

  setSelection: sel => set({ selection: sel }),
  clearSelection: () => set({ selection: { nodeIds: [], edgeIds: [], clusterId: null } }),
  selectNode: id => set({ selection: { nodeIds: [id], edgeIds: [], clusterId: null } }),
  toggleSelectNode: id =>
    set(s => {
      const already = s.selection.nodeIds.includes(id);
      return {
        selection: {
          ...s.selection,
          nodeIds: already ? s.selection.nodeIds.filter(n => n !== id) : [...s.selection.nodeIds, id],
        },
      };
    }),
  selectEdge: id => set({ selection: { nodeIds: [], edgeIds: [id], clusterId: null } }),
  selectCluster: id => set({ selection: { nodeIds: [], edgeIds: [], clusterId: id } }),

  setCursorMode: mode => set({ cursorMode: mode }),
  setCanvasTransform: t => set({ canvasTransform: t }),
  setBackgroundStyle: s => set({ backgroundStyle: s }),
  toggleMinimap: () => set(s => ({ showMinimap: !s.showMinimap })),
  setDraftEdge: draft => set({ draftEdge: draft }),

  markHintShown: key => {
    set(s => {
      const hints = {
        ...s.hints,
        shown: s.hints.shown.includes(key) ? s.hints.shown : [...s.hints.shown, key],
      };
      saveHints(hints);
      return { hints };
    });
  },

  incrementInteraction: () => {
    set(s => {
      const hints = { ...s.hints, interactionCount: s.hints.interactionCount + 1 };
      saveHints(hints);
      return { hints };
    });
  },
}));
