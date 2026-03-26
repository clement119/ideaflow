# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development commands

```bash
npm run dev       # Start Vite dev server (HMR)
npm run build     # TypeScript check + production build
npm run lint      # ESLint
npm run preview   # Preview the production build
```

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Rendering | Inline SVG in DOM |
| State | Zustand 5 (normalised store) |
| Animation | Framer Motion 12 (spring physics) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite` plugin) |
| IDs | nanoid |
| Persistence | localStorage auto-save on every command execution |

---

## Architecture

### Source layout

```
src/
├── store/
│   ├── types.ts        # INode, IEdge, ICluster, CursorMode, CanvasTransform
│   ├── store.ts        # Zustand store — all state + actions
│   ├── commands.ts     # Command pattern classes (ICommand + all mutations)
│   └── persistence.ts  # localStorage save/load
├── utils/
│   ├── geometry.ts     # Bezier routing, centroid, bounding box, resolveEndpointRect
│   ├── viewport.ts     # screenToCanvas, canvasToScreen, zoomAroundPoint, fitToViewport
│   ├── ids.ts          # nanoid wrapper
│   └── colours.ts      # NODE_COLOURS, CLUSTER_COLOURS palettes
├── assets/
│   └── cursors.ts      # CursorMode → SVG data URI map (all 9 states, 32×32px)
├── hooks/
│   └── useKeyboard.ts  # Global keyboard shortcut handler
├── components/
│   ├── Canvas/         # Canvas.tsx (SVG root), DotGrid.tsx, Minimap.tsx
│   ├── Node/           # NodeRenderer, NodeDefault/Idea/Note, ResizeHandle, ConnectionHandle
│   ├── Edge/           # EdgeRenderer, EdgePath, DraftEdge
│   ├── Cluster/        # ClusterRenderer, ClusterExpanded, ClusterCollapsed
│   ├── Selection/      # SelectionRect (rubber-band multi-select)
│   ├── Toolbar/        # ContextualToolbar (HTML portal, all 4 contexts)
│   ├── Onboarding/     # EmptyState, HintTooltip
│   └── Overlays/       # ShortcutsModal (? key)
└── App.tsx             # Root: mounts Canvas + useKeyboard
```

### State shape

```
store
├── nodes:    Record<id, INode>
├── edges:    Record<id, IEdge>
├── clusters: Record<id, ICluster>
├── selection: { nodeIds, edgeIds, clusterId }
├── cursorMode: CursorMode          ← enum drives CSS cursor on canvas container
├── canvasTransform: { x, y, zoom } ← SVG <g> transform
├── draftEdge: { sourceId, x, y } | null
├── backgroundStyle: 'grid' | 'plain'
├── showMinimap: boolean
├── hints: { shown: string[], interactionCount: number }
└── undoStack / redoStack           ← ICommand[]
```

### Command pattern

Every mutation goes through `store.execute(cmd)`:
- Calls `cmd.execute(state)` → returns a `Partial<StoreState>` patch
- Pushes cmd to `undoStack`, clears `redoStack`
- Auto-saves nodes/edges/clusters to localStorage

`cmd.undo(state)` returns the reverse patch. `store.undo()` / `store.redo()` pop from the respective stacks.

### Canvas pan/zoom

The SVG `<g id="world">` has `transform="translate(x, y) scale(zoom)"`. All content lives inside it.

- **Pan**: Space+pointerdown, accumulate delta into `canvasTransform.x/y`
- **Zoom**: `wheel` event, `zoomAroundPoint()` in `utils/viewport.ts` keeps the world point under the cursor fixed
- **Coordinate conversion**: `screenToCanvas()` / `canvasToScreen()` in `utils/viewport.ts`

### Cursor system

`cursorMode` is set by interaction handlers (node hover, drag, handle hover, etc.) and a Space key listener. The canvas container `div` has `style={{ cursor: CURSORS[cursorMode] }}` where `CURSORS` is the map from `assets/cursors.ts`. Cursor logic must not be scattered into component hover handlers — only `setCursorMode` calls.

### Edge routing

`utils/geometry.ts::routeEdge(sourceRect, targetRect)` picks the nearest anchor pair (midpoints of 4 sides), returns a cubic bezier `d` string + midpoint. When an edge endpoint node is inside a collapsed cluster, `resolveEndpointRect()` returns the cluster's bounding rect instead.

### Cluster animations

Framer Motion `AnimatePresence` + `motion.g` with `initial/animate/exit` springs. The stagger on expand is `delay: index * 0.04`.

---

## Key behaviour specs

- Double-click empty canvas → create node at cursor, auto-focus for typing
- Hover node → connection handle appears at right-centre; drag to node or empty canvas (creates connected node)
- Select 2+ nodes → toolbar → "Group" → cluster
- Collapse animation: spring 300ms toward centroid; expand: spring 350ms with 40ms per-node stagger
- Toolbar is contextual (not persistent): fades in 150ms, HTML portal above SVG
- `?` key opens shortcuts modal; `M` toggles minimap; `G` toggles grid/plain

Full feature spec in [`PRD.md`](./PRD.md).
