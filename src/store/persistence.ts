import type { INode, IEdge, ICluster, HintsState } from './types';

const KEY = 'ideaflow-canvas';
const HINTS_KEY = 'ideaflow-hints';

export interface PersistedState {
  nodes: Record<string, INode>;
  edges: Record<string, IEdge>;
  clusters: Record<string, ICluster>;
}

export function saveCanvas(state: PersistedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function loadCanvas(): PersistedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic schema validation
    if (!parsed.nodes || !parsed.edges || !parsed.clusters) return null;
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function saveHints(hints: HintsState): void {
  try {
    localStorage.setItem(HINTS_KEY, JSON.stringify(hints));
  } catch {}
}

export function loadHints(): HintsState | null {
  try {
    const raw = localStorage.getItem(HINTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HintsState;
  } catch {
    return null;
  }
}
