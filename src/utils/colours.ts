export const NODE_COLOURS = [
  '#f5e6ff', // lavender
  '#ffecd2', // peach
  '#d4f1f4', // mint
  '#fff3cd', // butter
  '#fce4ec', // blush
  '#e8f5e9', // sage
] as const;

export const DEFAULT_NODE_COLOUR = NODE_COLOURS[0];

export const CLUSTER_COLOURS = [
  'rgba(200,190,255,0.18)',
  'rgba(255,220,180,0.18)',
  'rgba(180,240,240,0.18)',
  'rgba(255,240,180,0.18)',
  'rgba(255,200,210,0.18)',
  'rgba(200,240,205,0.18)',
] as const;

export const DEFAULT_CLUSTER_COLOUR = CLUSTER_COLOURS[0];

/** Blend a hex colour toward white by `factor` (0–1). Used to make cards lighter than their parent bubble. */
export function lightenColour(hex: string, factor = 0.5): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * factor));
  const ng = Math.min(255, Math.round(g + (255 - g) * factor));
  const nb = Math.min(255, Math.round(b + (255 - b) * factor));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}
