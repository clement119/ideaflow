# Ideaflow — Product Requirements Document

**Version:** 0.1 (Draft)
**Last updated:** March 2026
**Status:** In review

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [Core design principles](#2-core-design-principles)
3. [Feature requirements](#3-feature-requirements)
   - 3.1 [Canvas](#31-canvas)
   - 3.2 [Nodes and bubbles](#32-nodes-and-bubbles)
   - 3.3 [Connections (edges)](#33-connections-edges)
   - 3.4 [Drag and drop](#34-drag-and-drop)
   - 3.5 [Clusters (groups)](#35-clusters-groups)
   - 3.6 [Contextual toolbar](#36-contextual-toolbar)
   - 3.7 [Onboarding and contextual hints](#37-onboarding-and-contextual-hints)
   - 3.8 [Keyboard shortcuts](#38-keyboard-shortcuts)
   - 3.9 [Custom cursor](#39-custom-cursor)
4. [Animations and motion design](#4-animations-and-motion-design)
5. [Technical considerations](#5-technical-considerations)
6. [Out of scope for v1](#6-out-of-scope-for-v1)
7. [Success metrics](#7-success-metrics)

---

## 1. Product overview

Ideaflow is a browser-based ideation canvas that lets users think visually through interconnected nodes and bubbles. It targets early-stage thinking — brainstorms, concept mapping, project planning — where the friction of traditional tools (slide decks, documents, whiteboards) slows down creative flow. The north star experience: it feels as fast as a sticky note wall, but behaves like a polished design tool.

**Target users:** Solo thinkers, product managers, designers, students, and small teams doing collaborative ideation.

---

## 2. Core design principles

**Minimal surface, maximum depth.**
The canvas should feel almost empty until you start using it. No visible toolbar clutter — controls surface only when contextually relevant.

**Physics-feel interactions.**
Every drag, snap, and collapse should have a spring-eased quality — never mechanical or abrupt. Motion is purposeful, not decorative.

**One primary action at all times.**
The UI always nudges toward a single clear next step based on context (empty canvas → add a node; node selected → connect or group; cluster collapsed → expand).

---

## 3. Feature requirements

### 3.1 Canvas

- Infinite canvas with smooth pan (drag on empty space) and pinch/scroll zoom
- Mini-map in the corner for orientation at a glance (optional toggle)
- Auto-fit view when opening an existing board
- Canvas background: subtle dot grid or plain — user toggleable
- Keyboard shortcut: `Space` + drag to pan, `Cmd/Ctrl + 0` to fit all

---

### 3.2 Nodes and bubbles

Nodes are the atomic unit. Each node is a rounded pill or circle containing a short label.

**Types**
- Default — circle or pill shape
- Idea — softer bubble aesthetic
- Note — small rectangular tag

**Behaviour**
- **Creation:** Double-click on empty canvas → spawns a new node at cursor position, auto-focused for typing
- **Editing:** Single-click to select; double-click to edit inline. Pressing `Enter` confirms and deselects
- **Resize:** Drag corner handle (appears on hover); proportional scaling
- **Delete:** `Backspace` or `Delete` key when selected; soft fade-out animation on removal
- **Colour coding:** 5–6 subtle palette swatches on selection (muted pastels); colour persists with the node and its connected edges
- **Emoji / icon prefix:** Optional single icon at the start of a label for visual scanning

---

### 3.3 Connections (edges)

- **Creation:** Hover over a node → a small connection handle appears at the edge; drag from handle to another node to create a link
- **Behaviour on drag:** The edge rubber-bands and snaps to the nearest node on release; if dropped on empty canvas it creates a new connected node
- **Routing:** Edges auto-route with smooth cubic bezier curves; they recalculate smoothly as nodes are dragged (no jarring jump)
- **Labels:** Optional short label on an edge (click the midpoint to add); appears in a small ghost pill
- **Edge style:** Default solid; optionally dashed (for "weak link" or "dependency" semantics)
- **Deletion:** Click to select an edge → `Backspace` to delete; or right-click → "Remove connection"

---

### 3.4 Drag and drop

- Nodes can be dragged freely at any time; connected edges follow in real time
- Multi-select: `Shift + click` or drag a selection rect on empty canvas
- When multiple nodes are dragged, they move as a rigid group while maintaining relative positions
- Snap-to-grid optional; snap-to-neighbours (smart guides) optional — both off by default

---

### 3.5 Clusters (groups)

Clusters are expandable/collapsible containers around a group of related nodes. This is a key differentiating feature.

**Creation**
- Select 2+ nodes → right-click or toolbar → "Group into cluster"
- Or drag nodes onto an existing cluster border

**Collapsed state**
- Cluster shrinks to a single summary node showing the cluster name and item count badge (e.g. "Ideas · 4")
- All member nodes and their edges are hidden but preserved

**Expanded state**
- Cluster renders as a soft bounding box with the group label at the top
- Member nodes are fully visible and interactive inside

**Toggle**
- Click the collapse/expand icon on the cluster header
- Or double-click the summary node when collapsed

**Animation**
- Collapse: nodes scale toward the cluster centroid with a spring ease, 300ms
- Expand: nodes bloom outward, 350ms spring with slight stagger per node

**Nesting**
- Clusters can be nested one level deep (a cluster can contain another cluster)
- Deeper nesting is not supported in v1

**Moving a cluster**
- Dragging the cluster boundary moves the entire group
- Individual nodes can still be repositioned within the open cluster

**Edges across clusters**
- An edge from a node inside a cluster to a node outside renders to the cluster boundary when collapsed, and directly to the node when expanded
- This keeps the canvas readable at all zoom levels

---

### 3.6 Contextual toolbar

Rather than a persistent top bar, a floating mini-toolbar appears contextually:

| Context | Toolbar contents |
|---|---|
| Single node selected | Colour picker, node type, duplicate, delete |
| Edge selected | Style toggle (solid/dashed), add label, delete |
| Cluster selected | Rename, expand/collapse, colour, delete |
| Multi-select active | Group, align (H/V), distribute, delete all |

The toolbar fades in with a 150ms ease and dismisses when clicking away.

---

### 3.7 Onboarding and contextual hints

The tool must feel immediately approachable for first-time users without being patronising for returning ones.

**Empty state**
A single large prompt in the centre — "Double-click anywhere to start" with a subtle animated cursor illustration.

**Progressive hints (fires once per trigger, never repeats)**
1. First node created → tooltip pulse on the node edge: "Drag from here to connect" — disappears after 3 seconds or on first use
2. First connection made → hint at top: "Select 2+ nodes and right-click to group them"
3. First cluster created → hint: "Click the arrow to collapse your group"

**Rules**
- Each hint fires only once per user, tracked in localStorage
- After 5 total interactions, all hints stop permanently
- No onboarding wizard or sequential walkthrough — hints are ambient, not sequential

**Help overlay**
`?` key opens a minimal command palette / cheatsheet — top 8 shortcuts displayed in a modal overlay.

---

### 3.8 Keyboard shortcuts

| Action | Shortcut |
|---|---|
| New node at cursor | Double-click |
| Confirm edit | `Enter` |
| Cancel edit | `Esc` |
| Select all | `Cmd/Ctrl + A` |
| Undo | `Cmd/Ctrl + Z` |
| Redo | `Cmd/Ctrl + Shift + Z` |
| Duplicate node | `Cmd/Ctrl + D` |
| Fit all to view | `Cmd/Ctrl + 0` |
| Pan canvas | `Space` + drag |
| Delete selected | `Backspace` |
| Open command palette | `Cmd/Ctrl + K` |
| Show shortcuts | `?` |

---

### 3.9 Custom cursor

The cursor is part of the product's identity. It reinforces the "you are in a special creative space" feeling the moment a user enters the canvas window.

**Default canvas cursor**
A custom crosshair-style cursor — minimal, slightly larger than the OS default, with a small filled circle at the intersection point. This replaces the standard pointer the moment the mouse enters the canvas boundary, and reverts to the OS cursor when leaving (e.g. hovering over the browser chrome or a modal outside the canvas).

**Cursor states**

| Context | Cursor appearance |
|---|---|
| Empty canvas (idle) | Custom crosshair — thin lines, small dot centre |
| Hovering over a node | Custom grab hand (not OS default) |
| Dragging a node | Closed grab fist; slight scale-up on the cursor |
| Hovering over a connection handle | Small plus (+) cursor with a soft glow ring — signals "connect here" |
| Drawing an edge (drag in progress) | Pen/line cursor — a diagonal stroke icon |
| Hovering over a cluster header | Resize/move cursor with a subtle bounding-box indicator |
| Text editing inside a node | Standard I-beam (OS default acceptable for text precision) |
| Panning canvas (`Space` held) | Open hand; transitions to closed hand while dragging |
| Delete-ready (selected + `Backspace`) | Cursor tints to a muted red — subtle colour shift only |

**Design details**
- Implemented via CSS `cursor: url(...)` with a fallback to the closest semantic OS cursor (e.g. `grab`, `crosshair`, `text`)
- Cursor SVG assets designed at 32×32px with the hotspot (click point) explicitly declared
- All custom cursors use the same stroke weight and visual language as the node/edge design — consistent with the product's minimalist aesthetic
- Cursor transitions between states are instant — no easing on cursor swaps, as delayed transitions feel laggy and erode trust
- No cursor animations in v1 (a trailing particle effect or cursor dot follower is a v2 delight feature worth exploring)

**Implementation note**
Define cursor state as a derived value from the current interaction mode in the canvas state store. A single `cursorMode` enum drives which CSS class is applied to the canvas container — this keeps cursor logic centralised rather than scattered across individual component hover handlers.

---

## 4. Animations and motion design

All motion uses spring physics or cubic-ease curves — avoid linear transitions entirely.

| Interaction | Motion spec |
|---|---|
| Node appear | Scale 0.6 → 1.0, spring ease, 200ms |
| Node delete | Fade + scale to 0, ease-out, 150ms |
| Cluster collapse | Nodes scale toward centroid, spring, 300ms |
| Cluster expand | Nodes bloom outward, spring, 350ms with stagger per node |
| Edge draw (live) | Bezier recalculates at 60fps during drag |
| Toolbar appear | Fade in + translate Y −4px, 150ms |
| Hint tooltip | Fade in 200ms, pulse once, fade out after 3s |
| Cursor state change | Instant — no transition delay |

---

## 5. Technical considerations

**Rendering**
SVG-based canvas preferred for accessibility and CSS styling control. Fabric.js or Konva.js as alternatives if Canvas-based rendering is needed for performance at scale.

**State management**
Normalised node + edge + cluster store (Zustand or similar); full undo/redo stack via command pattern.

**Persistence**
Auto-save to localStorage on every change; optional export as JSON or PNG snapshot.

**Performance**
- Only render nodes within the visible viewport + a buffer zone
- Debounce edge recalculation during drag to avoid unnecessary repaints
- Cluster collapse/expand should never block the main thread — use `requestAnimationFrame` for animation frames

**Responsive**
Full desktop-first. Tablet support in v2. Mobile is out of scope for v1.

**Cursor assets**
Store cursor SVGs as inline data URIs in a central `cursors.ts` file. Avoid loading cursor images over the network to prevent flicker on state change.

---

## 6. Out of scope for v1

- Real-time multiplayer / collaboration
- AI-assisted idea generation or clustering
- Cloud sync / user accounts
- Import from Figma, Miro, Lucidchart, etc.
- Comments or reactions on nodes
- Mobile / touch-optimised controls
- Cursor animation effects (trailing dot, particle follow)
- Presentation / slideshow mode

---

## 7. Success metrics

| Metric | Target |
|---|---|
| Time to first connection | < 30 seconds from blank canvas |
| Hint dismissal rate | > 70% (hints are read, not rage-closed) |
| Avg. nodes per session | > 8 |
| Cluster usage rate | > 40% of sessions with 10+ nodes create at least one cluster |
| 30-day retention | > 25% |
| Cursor-related bug reports | 0 on state transitions in v1 launch window |
