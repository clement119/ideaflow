# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project status

This is a greenfield project. Currently the only file is `PRD.md` — no build tooling, source code, or configuration exists yet. When scaffolding begins, decisions should align with the technical direction in the PRD.

---

## Intended tech stack (from PRD)

- **Rendering:** SVG-based canvas (preferred for accessibility and CSS styling); Fabric.js or Konva.js as fallbacks if Canvas-based rendering is needed for performance
- **State management:** Zustand with a normalised node + edge + cluster store; full undo/redo via command pattern
- **Language:** TypeScript (the PRD references `cursors.ts` explicitly)
- **Persistence:** localStorage auto-save on every change; JSON and PNG export
- **Animation:** Spring physics / cubic-ease curves — no linear transitions

---

## Architecture (planned)

### Core domain entities

- **Node** — atomic unit; types: Default (pill/circle), Idea (bubble), Note (rectangular tag)
- **Edge** — bezier-curve connection between two nodes; optional label and style (solid/dashed)
- **Cluster** — expandable/collapsible group of nodes; nestable one level deep; collapses to a summary node with item-count badge
- **Canvas** — infinite pan/zoom surface; dot-grid or plain background; minimap overlay

### State shape (normalised)

```
store
├── nodes:    Record<id, Node>
├── edges:    Record<id, Edge>
├── clusters: Record<id, Cluster>
├── selection: id[]
├── cursorMode: CursorMode  ← single enum drives CSS class on canvas container
└── undoStack / redoStack
```

### Cursor system

`cursorMode` is a derived enum from the current interaction mode. A single CSS class on the canvas container drives all cursor changes — cursor logic must **not** be scattered across individual component hover handlers. Cursor SVGs live in `cursors.ts` as inline data URIs (no network fetch, prevents flicker).

### Cluster edge routing

When a cluster is collapsed, edges that connect to nodes inside it must re-route to the cluster boundary. When expanded, they route directly to the node. This logic belongs in edge-rendering, not in cluster or node components.

### Onboarding hints

Hints fire once per trigger, tracked in `localStorage`. After 5 total interactions all hints stop permanently. No walkthrough — hints are ambient.

---

## Key behaviour specs (quick reference)

- Double-click empty canvas → create node at cursor, auto-focus for typing
- Hover node → connection handle appears; drag handle to node or empty canvas (creates connected node)
- Select 2+ nodes → right-click/toolbar → "Group into cluster"
- Collapse animation: nodes scale toward cluster centroid, spring ease, 300 ms
- Expand animation: nodes bloom outward, spring ease, 350 ms with per-node stagger
- Toolbar is contextual (not persistent): fades in 150 ms, dismisses on click-away
- `?` key opens shortcuts cheatsheet modal

Full details in [`PRD.md`](./PRD.md).
