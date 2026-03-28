import type { INode, IEdge, ICluster, ICard, IComment } from './types';

export interface ICommand {
  execute(state: StoreState): Partial<StoreState>;
  undo(state: StoreState): Partial<StoreState>;
  description: string;
}

// Imported lazily to avoid circular deps — StoreState shape mirrored here
export interface StoreState {
  nodes: Record<string, INode>;
  edges: Record<string, IEdge>;
  clusters: Record<string, ICluster>;
}

// ─── Node Commands ─────────────────────────────────────────────────────────

export class AddNodeCommand implements ICommand {
  description = 'Add node';
  constructor(private node: INode) {}

  execute(state: StoreState) {
    return { nodes: { ...state.nodes, [this.node.id]: this.node } };
  }
  undo(state: StoreState) {
    const nodes = { ...state.nodes };
    delete nodes[this.node.id];
    return { nodes };
  }
}

export class DeleteNodeCommand implements ICommand {
  description = 'Delete node';
  private deletedEdges: IEdge[] = [];

  constructor(private nodeId: string, private snapshot: INode) {}

  execute(state: StoreState) {
    const nodes = { ...state.nodes };
    delete nodes[this.nodeId];
    // Also remove connected edges
    const edges = { ...state.edges };
    this.deletedEdges = Object.values(state.edges).filter(
      e => e.sourceId === this.nodeId || e.targetId === this.nodeId
    );
    this.deletedEdges.forEach(e => delete edges[e.id]);
    return { nodes, edges };
  }
  undo(state: StoreState) {
    const nodes = { ...state.nodes, [this.nodeId]: this.snapshot };
    const edges = { ...state.edges };
    this.deletedEdges.forEach(e => (edges[e.id] = e));
    return { nodes, edges };
  }
}

export class MoveNodeCommand implements ICommand {
  description = 'Move node';
  constructor(
    private nodeId: string,
    private from: { x: number; y: number },
    private to: { x: number; y: number }
  ) {}

  execute(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return { nodes: { ...state.nodes, [this.nodeId]: { ...node, ...this.to } } };
  }
  undo(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return { nodes: { ...state.nodes, [this.nodeId]: { ...node, ...this.from } } };
  }
}

export class MultiMoveCommand implements ICommand {
  description = 'Move nodes';
  constructor(
    private moves: Array<{ nodeId: string; from: { x: number; y: number }; to: { x: number; y: number } }>
  ) {}

  execute(state: StoreState) {
    const nodes = { ...state.nodes };
    for (const { nodeId, to } of this.moves) {
      if (nodes[nodeId]) nodes[nodeId] = { ...nodes[nodeId], ...to };
    }
    return { nodes };
  }
  undo(state: StoreState) {
    const nodes = { ...state.nodes };
    for (const { nodeId, from } of this.moves) {
      if (nodes[nodeId]) nodes[nodeId] = { ...nodes[nodeId], ...from };
    }
    return { nodes };
  }
}

export class EditNodeCommand implements ICommand {
  description = 'Edit node';
  constructor(
    private nodeId: string,
    private from: Partial<INode>,
    private to: Partial<INode>
  ) {}

  execute(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return { nodes: { ...state.nodes, [this.nodeId]: { ...node, ...this.to } } };
  }
  undo(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return { nodes: { ...state.nodes, [this.nodeId]: { ...node, ...this.from } } };
  }
}

export class ResizeNodeCommand implements ICommand {
  description = 'Resize node';
  constructor(
    private nodeId: string,
    private from: { width: number; height: number },
    private to: { width: number; height: number }
  ) {}

  execute(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return { nodes: { ...state.nodes, [this.nodeId]: { ...node, ...this.to } } };
  }
  undo(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return { nodes: { ...state.nodes, [this.nodeId]: { ...node, ...this.from } } };
  }
}

export class DuplicateNodeCommand implements ICommand {
  description = 'Duplicate node';
  private copy: INode;
  constructor(_original: INode, copy: INode) { this.copy = copy; }

  execute(state: StoreState) {
    return { nodes: { ...state.nodes, [this.copy.id]: this.copy } };
  }
  undo(state: StoreState) {
    const nodes = { ...state.nodes };
    delete nodes[this.copy.id];
    return { nodes };
  }
}

// ─── Edge Commands ──────────────────────────────────────────────────────────

export class AddEdgeCommand implements ICommand {
  description = 'Add edge';
  constructor(private edge: IEdge) {}

  execute(state: StoreState) {
    return { edges: { ...state.edges, [this.edge.id]: this.edge } };
  }
  undo(state: StoreState) {
    const edges = { ...state.edges };
    delete edges[this.edge.id];
    return { edges };
  }
}

export class DeleteEdgeCommand implements ICommand {
  description = 'Delete edge';
  constructor(private edgeId: string, private snapshot: IEdge) {}

  execute(state: StoreState) {
    const edges = { ...state.edges };
    delete edges[this.edgeId];
    return { edges };
  }
  undo(state: StoreState) {
    return { edges: { ...state.edges, [this.edgeId]: this.snapshot } };
  }
}

export class EditEdgeCommand implements ICommand {
  description = 'Edit edge';
  constructor(
    private edgeId: string,
    private from: Partial<IEdge>,
    private to: Partial<IEdge>
  ) {}

  execute(state: StoreState) {
    const edge = state.edges[this.edgeId];
    if (!edge) return {};
    return { edges: { ...state.edges, [this.edgeId]: { ...edge, ...this.to } } };
  }
  undo(state: StoreState) {
    const edge = state.edges[this.edgeId];
    if (!edge) return {};
    return { edges: { ...state.edges, [this.edgeId]: { ...edge, ...this.from } } };
  }
}

// ─── Cluster Commands ────────────────────────────────────────────────────────

export class CreateClusterCommand implements ICommand {
  description = 'Create cluster';
  constructor(private cluster: ICluster) {}

  execute(state: StoreState) {
    return { clusters: { ...state.clusters, [this.cluster.id]: this.cluster } };
  }
  undo(state: StoreState) {
    const clusters = { ...state.clusters };
    delete clusters[this.cluster.id];
    return { clusters };
  }
}

export class DeleteClusterCommand implements ICommand {
  description = 'Delete cluster';
  constructor(private clusterId: string, private snapshot: ICluster) {}

  execute(state: StoreState) {
    const clusters = { ...state.clusters };
    delete clusters[this.clusterId];
    return { clusters };
  }
  undo(state: StoreState) {
    return { clusters: { ...state.clusters, [this.clusterId]: this.snapshot } };
  }
}

export class CollapseClusterCommand implements ICommand {
  description = 'Toggle cluster';
  constructor(
    private clusterId: string,
    private isCollapsed: boolean,
    private prevPositions: Record<string, { x: number; y: number }>,
    private centroid: { x: number; y: number }
  ) {}

  execute(state: StoreState) {
    const cluster = state.clusters[this.clusterId];
    if (!cluster) return {};
    const nodes = { ...state.nodes };
    if (this.isCollapsed) {
      // Move member nodes to centroid (visually hidden)
      cluster.memberNodeIds.forEach(id => {
        if (nodes[id]) nodes[id] = { ...nodes[id], x: this.centroid.x, y: this.centroid.y };
      });
    } else {
      // Restore previous positions
      cluster.memberNodeIds.forEach(id => {
        const prev = this.prevPositions[id];
        if (nodes[id] && prev) nodes[id] = { ...nodes[id], ...prev };
      });
    }
    return {
      nodes,
      clusters: { ...state.clusters, [this.clusterId]: { ...cluster, isCollapsed: this.isCollapsed } },
    };
  }
  undo(state: StoreState) {
    const cluster = state.clusters[this.clusterId];
    if (!cluster) return {};
    const nodes = { ...state.nodes };
    if (!this.isCollapsed) {
      // Was expanded → undo means collapse again → move to centroid
      cluster.memberNodeIds.forEach(id => {
        if (nodes[id]) nodes[id] = { ...nodes[id], x: this.centroid.x, y: this.centroid.y };
      });
    } else {
      // Was collapsed → undo means restore positions
      cluster.memberNodeIds.forEach(id => {
        const prev = this.prevPositions[id];
        if (nodes[id] && prev) nodes[id] = { ...nodes[id], ...prev };
      });
    }
    return {
      nodes,
      clusters: { ...state.clusters, [this.clusterId]: { ...cluster, isCollapsed: !this.isCollapsed } },
    };
  }
}

export class MoveClusterCommand implements ICommand {
  description = 'Move cluster';
  constructor(
    private clusterId: string,
    private delta: { dx: number; dy: number },
    private memberIds: string[]
  ) {}

  execute(state: StoreState) {
    const cluster = state.clusters[this.clusterId];
    if (!cluster) return {};
    const nodes = { ...state.nodes };
    this.memberIds.forEach(id => {
      if (nodes[id]) nodes[id] = { ...nodes[id], x: nodes[id].x + this.delta.dx, y: nodes[id].y + this.delta.dy };
    });
    return {
      nodes,
      clusters: {
        ...state.clusters,
        [this.clusterId]: { ...cluster, x: cluster.x + this.delta.dx, y: cluster.y + this.delta.dy },
      },
    };
  }
  undo(state: StoreState) {
    const cluster = state.clusters[this.clusterId];
    if (!cluster) return {};
    const nodes = { ...state.nodes };
    this.memberIds.forEach(id => {
      if (nodes[id]) nodes[id] = { ...nodes[id], x: nodes[id].x - this.delta.dx, y: nodes[id].y - this.delta.dy };
    });
    return {
      nodes,
      clusters: {
        ...state.clusters,
        [this.clusterId]: { ...cluster, x: cluster.x - this.delta.dx, y: cluster.y - this.delta.dy },
      },
    };
  }
}

export class AlignCommand implements ICommand {
  description = 'Align nodes';
  private nodeIds: string[];
  private before: Record<string, { x: number; y: number }>;
  private after: Record<string, { x: number; y: number }>;
  constructor(
    nodeIds: string[],
    _axis: 'horizontal' | 'vertical',
    before: Record<string, { x: number; y: number }>,
    after: Record<string, { x: number; y: number }>
  ) { this.nodeIds = nodeIds; this.before = before; this.after = after; }

  execute(state: StoreState) {
    const nodes = { ...state.nodes };
    this.nodeIds.forEach(id => {
      if (nodes[id] && this.after[id]) nodes[id] = { ...nodes[id], ...this.after[id] };
    });
    return { nodes };
  }
  undo(state: StoreState) {
    const nodes = { ...state.nodes };
    this.nodeIds.forEach(id => {
      if (nodes[id] && this.before[id]) nodes[id] = { ...nodes[id], ...this.before[id] };
    });
    return { nodes };
  }
}

// ─── Card Commands ───────────────────────────────────────────────────────────

function patchNode(state: StoreState, nodeId: string, patch: Partial<INode>) {
  const node = state.nodes[nodeId];
  if (!node) return {};
  return { nodes: { ...state.nodes, [nodeId]: { ...node, ...patch } } };
}

export class AddCardCommand implements ICommand {
  description = 'Add card';
  constructor(private nodeId: string, private card: ICard) {}

  execute(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return patchNode(state, this.nodeId, {
      cards: [...(node.cards ?? []), this.card],
      cardsExpanded: true,
    });
  }
  undo(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return patchNode(state, this.nodeId, {
      cards: (node.cards ?? []).filter(c => c.id !== this.card.id),
    });
  }
}

export class EditCardCommand implements ICommand {
  description = 'Edit card';
  constructor(
    private nodeId: string,
    private cardId: string,
    private from: Partial<ICard>,
    private to: Partial<ICard>
  ) {}

  execute(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return patchNode(state, this.nodeId, {
      cards: (node.cards ?? []).map(c => c.id === this.cardId ? { ...c, ...this.to } : c),
    });
  }
  undo(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return patchNode(state, this.nodeId, {
      cards: (node.cards ?? []).map(c => c.id === this.cardId ? { ...c, ...this.from } : c),
    });
  }
}

export class DeleteCardCommand implements ICommand {
  description = 'Delete card';
  constructor(private nodeId: string, private card: ICard) {}

  execute(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return patchNode(state, this.nodeId, {
      cards: (node.cards ?? []).filter(c => c.id !== this.card.id),
    });
  }
  undo(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    return patchNode(state, this.nodeId, {
      cards: [...(node.cards ?? []), this.card],
    });
  }
}

export class ToggleCardsCommand implements ICommand {
  description = 'Toggle cards';
  constructor(private nodeId: string, private expanded: boolean) {}

  execute(state: StoreState) {
    return patchNode(state, this.nodeId, { cardsExpanded: this.expanded });
  }
  undo(state: StoreState) {
    return patchNode(state, this.nodeId, { cardsExpanded: !this.expanded });
  }
}

// ─── Comment Commands ────────────────────────────────────────────────────────

export class AddCommentCommand implements ICommand {
  description = 'Add comment';
  constructor(
    private nodeId: string,
    private cardId: string | null,
    private comment: IComment
  ) {}

  execute(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    if (this.cardId) {
      return patchNode(state, this.nodeId, {
        cards: (node.cards ?? []).map(c =>
          c.id === this.cardId
            ? { ...c, comments: [...(c.comments ?? []), this.comment] }
            : c
        ),
      });
    }
    return patchNode(state, this.nodeId, {
      comments: [...(node.comments ?? []), this.comment],
    });
  }
  undo(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    if (this.cardId) {
      return patchNode(state, this.nodeId, {
        cards: (node.cards ?? []).map(c =>
          c.id === this.cardId
            ? { ...c, comments: (c.comments ?? []).filter(cm => cm.id !== this.comment.id) }
            : c
        ),
      });
    }
    return patchNode(state, this.nodeId, {
      comments: (node.comments ?? []).filter(cm => cm.id !== this.comment.id),
    });
  }
}

export class DeleteCommentCommand implements ICommand {
  description = 'Delete comment';
  constructor(
    private nodeId: string,
    private cardId: string | null,
    private comment: IComment
  ) {}

  execute(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    if (this.cardId) {
      return patchNode(state, this.nodeId, {
        cards: (node.cards ?? []).map(c =>
          c.id === this.cardId
            ? { ...c, comments: (c.comments ?? []).filter(cm => cm.id !== this.comment.id) }
            : c
        ),
      });
    }
    return patchNode(state, this.nodeId, {
      comments: (node.comments ?? []).filter(cm => cm.id !== this.comment.id),
    });
  }
  undo(state: StoreState) {
    const node = state.nodes[this.nodeId];
    if (!node) return {};
    if (this.cardId) {
      return patchNode(state, this.nodeId, {
        cards: (node.cards ?? []).map(c =>
          c.id === this.cardId
            ? { ...c, comments: [...(c.comments ?? []), this.comment] }
            : c
        ),
      });
    }
    return patchNode(state, this.nodeId, {
      comments: [...(node.comments ?? []), this.comment],
    });
  }
}
