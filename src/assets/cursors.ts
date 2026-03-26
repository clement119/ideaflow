import type { CursorMode } from '../store/types';

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// All SVGs are 32×32px. Hotspot format: "url(...) hotX hotY, fallback"

const idle = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <line x1="16" y1="4" x2="16" y2="28" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="4" y1="16" x2="28" y2="16" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="2.5" fill="#333"/>
</svg>`);

const hoverNode = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M10 8 C8 8 6 10 6 12 L6 20 C6 21.1 6.9 22 8 22 L8 24 C8 25.1 8.9 26 10 26 L22 26 C23.1 26 24 25.1 24 24 L24 12 C24 10 22 8 20 8 Z" fill="none" stroke="#333" stroke-width="1.5"/>
  <circle cx="10" cy="8" r="2" fill="#333"/>
  <circle cx="10" cy="14" r="2" fill="#333"/>
  <circle cx="10" cy="20" r="2" fill="#333"/>
</svg>`);

const dragNode = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="8" y="10" width="16" height="14" rx="2" fill="none" stroke="#333" stroke-width="1.5"/>
  <path d="M8 10 L8 8 C8 6.9 8.9 6 10 6 L22 6 C23.1 6 24 6.9 24 8 L24 10" stroke="#333" stroke-width="1.5" fill="none"/>
  <line x1="12" y1="6" x2="12" y2="10" stroke="#333" stroke-width="1.5"/>
  <line x1="16" y1="6" x2="16" y2="10" stroke="#333" stroke-width="1.5"/>
  <line x1="20" y1="6" x2="20" y2="10" stroke="#333" stroke-width="1.5"/>
</svg>`);

const hoverHandle = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="10" fill="none" stroke="#7c3aed" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
  <line x1="16" y1="8" x2="16" y2="24" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
  <line x1="8" y1="16" x2="24" y2="16" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
</svg>`);

const drawEdge = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <line x1="6" y1="26" x2="22" y2="10" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="22" cy="10" r="2.5" fill="#333"/>
  <circle cx="6" cy="26" r="2" fill="none" stroke="#333" stroke-width="1.5"/>
</svg>`);

const hoverCluster = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="5" y="5" width="22" height="22" rx="3" fill="none" stroke="#333" stroke-width="1.5" stroke-dasharray="3 2"/>
  <line x1="16" y1="10" x2="16" y2="22" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="10" y1="16" x2="22" y2="16" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
</svg>`);

const textEdit = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <line x1="16" y1="6" x2="16" y2="26" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="6" x2="20" y2="6" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="12" y1="26" x2="20" y2="26" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
</svg>`);

const panIdle = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M16 6 L16 10 M16 22 L16 26 M6 16 L10 16 M22 16 L26 16" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M13 10 L10 10 C8.9 10 8 10.9 8 12 L8 22 C8 23.1 8.9 24 10 24 L22 24 C23.1 24 24 23.1 24 22 L24 12 C24 10.9 23.1 10 22 10 L19 10" fill="none" stroke="#333" stroke-width="1.5"/>
</svg>`);

const panDrag = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="8" y="12" width="16" height="14" rx="2" fill="none" stroke="#333" stroke-width="1.5"/>
  <path d="M13 12 L13 9 C13 7.9 13.9 7 15 7 L17 7 C18.1 7 19 7.9 19 9 L19 12" fill="none" stroke="#333" stroke-width="1.5"/>
</svg>`);

const deleteReady = svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <line x1="16" y1="4" x2="16" y2="28" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="4" y1="16" x2="28" y2="16" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="2.5" fill="#dc2626"/>
</svg>`);

export const CURSORS: Record<CursorMode, string> = {
  'idle':          `url("${idle}") 16 16, crosshair`,
  'hover-node':    `url("${hoverNode}") 10 6, grab`,
  'drag-node':     `url("${dragNode}") 12 10, grabbing`,
  'hover-handle':  `url("${hoverHandle}") 16 16, crosshair`,
  'draw-edge':     `url("${drawEdge}") 6 26, crosshair`,
  'hover-cluster': `url("${hoverCluster}") 16 16, move`,
  'text-edit':     `url("${textEdit}") 16 16, text`,
  'pan-idle':      `url("${panIdle}") 16 16, grab`,
  'pan-drag':      `url("${panDrag}") 16 16, grabbing`,
  'delete-ready':  `url("${deleteReady}") 16 16, crosshair`,
};
