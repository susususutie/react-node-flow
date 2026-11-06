import { describe, it, expect } from "vite-plus/test";
import storeReducer from "../../store/storeReducer";
import type { StoreStateType } from "../../types";

function makeState(overrides?: Partial<StoreStateType>): StoreStateType {
  return {
    nfId: "test",
    domNode: null,
    minZoom: 0.1,
    maxZoom: 4,
    nodes: [],
    edges: [],
    nodesControlled: false,
    edgesControlled: false,
    nodeLookup: new Map(),
    edgeLookup: new Map(),
    nodeTypes: {},
    edgeTypes: {},
    onNodesChange: null,
    onEdgesChange: null,
    onConnect: null,
    isValidConnection: null,
    onNodeDrag: null,
    onNodeDragStart: null,
    onNodeDragStop: null,
    onNodeClick: null,
    onNodeDoubleClick: null,
    onEdgeClick: null,
    onPaneClick: null,
    defaultViewport: { x: 0, y: 0, zoom: 1 },
    panZoom: null,
    nodesConnectable: true,
    nodesDraggable: true,
    nodesSelectable: true,
    zoomOnScroll: true,
    zoomOnPinch: true,
    zoomOnDoubleClick: true,
    panOnScroll: false,
    preventScrolling: true,
    transform: [0, 0, 1],
    mousePosition: { x: 0, y: 0 },
    selectedPoint: null,
    isPanning: false,
    snapToGrid: false,
    snapGrid: [15, 15],
    connectionState: null,
    ...overrides,
  };
}

// ─── transform ────────────────────────────────────────────────
describe("transform action", () => {
  it("updates transform tuple", () => {
    const state = makeState();
    const next = storeReducer(state, { type: "transform", payload: [10, 20, 1.5] });
    expect(next.transform).toEqual([10, 20, 1.5]);
  });

  it("clamps zoom to minZoom", () => {
    const state = makeState({ minZoom: 0.5 });
    const next = storeReducer(state, { type: "transform", payload: [0, 0, 0.1] });
    expect(next.transform[2]).toBe(0.5);
  });

  it("clamps zoom to maxZoom", () => {
    const state = makeState({ maxZoom: 3 });
    const next = storeReducer(state, { type: "transform", payload: [0, 0, 10] });
    expect(next.transform[2]).toBe(3);
  });

  it("rejects non-finite x/y/zoom", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "transform", payload: [NaN, 0, 1] })).toBe(state);
    expect(storeReducer(state, { type: "transform", payload: [0, Infinity, 1] })).toBe(state);
    expect(storeReducer(state, { type: "transform", payload: [0, 0, NaN] })).toBe(state);
  });

  it("returns same state ref when values unchanged", () => {
    const state = makeState({ transform: [10, 20, 1.5] });
    expect(storeReducer(state, { type: "transform", payload: [10, 20, 1.5] })).toBe(state);
  });
});

// ─── syncViewport ─────────────────────────────────────────────
describe("syncViewport action", () => {
  it("updates transform from Viewport object", () => {
    const state = makeState();
    const next = storeReducer(state, { type: "syncViewport", payload: { x: 50, y: 60, zoom: 2 } });
    expect(next.transform).toEqual([50, 60, 2]);
  });

  it("clamps zoom", () => {
    const state = makeState({ minZoom: 0.5, maxZoom: 3 });
    const next = storeReducer(state, { type: "syncViewport", payload: { x: 0, y: 0, zoom: 10 } });
    expect(next.transform[2]).toBe(3);
  });

  it("rejects non-finite values", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "syncViewport", payload: { x: NaN, y: 0, zoom: 1 } })).toBe(
      state,
    );
  });

  it("returns same state when values match", () => {
    const state = makeState({ transform: [10, 20, 1.5] });
    expect(
      storeReducer(state, { type: "syncViewport", payload: { x: 10, y: 20, zoom: 1.5 } }),
    ).toBe(state);
  });
});

// ─── updateInternalNodeMeasured ───────────────────────────────
describe("updateInternalNodeMeasured action", () => {
  it("updates node measured dimensions", () => {
    const nodeLookup = new Map([
      [
        "a",
        {
          id: "a",
          internals: {
            measured: { width: 50, height: 50 },
            positionAbsolute: { x: 0, y: 0 },
            zIndex: 0,
            handles: null,
          },
        } as any,
      ],
    ]);
    const state = makeState({ nodeLookup });
    const next = storeReducer(state, {
      type: "updateInternalNodeMeasured",
      payload: { id: "a", width: 100, height: 80 },
    });
    expect(next.nodeLookup.get("a")!.internals.measured).toEqual({ width: 100, height: 80 });
  });

  it("rejects empty id string", () => {
    const state = makeState();
    expect(
      storeReducer(state, {
        type: "updateInternalNodeMeasured",
        payload: { id: "", width: 10, height: 10 },
      }),
    ).toBe(state);
  });

  it("rejects non-number width/height", () => {
    const state = makeState();
    expect(
      storeReducer(state, {
        type: "updateInternalNodeMeasured",
        payload: { id: "a", width: NaN, height: 10 },
      }),
    ).toBe(state);
  });

  it("rejects negative width/height", () => {
    const state = makeState();
    expect(
      storeReducer(state, {
        type: "updateInternalNodeMeasured",
        payload: { id: "a", width: -1, height: 10 },
      }),
    ).toBe(state);
  });

  it("no-op when node not found", () => {
    const state = makeState();
    expect(
      storeReducer(state, {
        type: "updateInternalNodeMeasured",
        payload: { id: "missing", width: 10, height: 10 },
      }),
    ).toBe(state);
  });

  it("no-op when dimensions unchanged", () => {
    const nodeLookup = new Map([
      [
        "a",
        {
          id: "a",
          internals: {
            measured: { width: 100, height: 80 },
            positionAbsolute: { x: 0, y: 0 },
            zIndex: 0,
            handles: null,
          },
        } as any,
      ],
    ]);
    const state = makeState({ nodeLookup });
    expect(
      storeReducer(state, {
        type: "updateInternalNodeMeasured",
        payload: { id: "a", width: 100, height: 80 },
      }),
    ).toBe(state);
  });
});

// ─── applyNodeChanges ─────────────────────────────────────────
describe("applyNodeChanges action", () => {
  it("removes node by id", () => {
    const state = makeState({ nodes: [{ id: "a", position: { x: 0, y: 0 } } as any] });
    const next = storeReducer(state, {
      type: "applyNodeChanges",
      payload: [{ id: "a", type: "remove" }],
    });
    expect(next.nodes).toHaveLength(0);
  });

  it("selects node", () => {
    const state = makeState({
      nodes: [{ id: "a", position: { x: 0, y: 0 }, selected: false } as any],
    });
    const next = storeReducer(state, {
      type: "applyNodeChanges",
      payload: [{ id: "a", type: "select", selected: true }],
    });
    expect(next.nodes[0].selected).toBe(true);
  });

  it("updates node position", () => {
    const state = makeState({ nodes: [{ id: "a", position: { x: 0, y: 0 } } as any] });
    const next = storeReducer(state, {
      type: "applyNodeChanges",
      payload: [{ id: "a", type: "position", position: { x: 50, y: 60 } }],
    });
    expect(next.nodes[0].position).toEqual({ x: 50, y: 60 });
  });

  it("sets dragging flag", () => {
    const state = makeState({
      nodes: [{ id: "a", position: { x: 0, y: 0 }, dragging: false } as any],
    });
    const next = storeReducer(state, {
      type: "applyNodeChanges",
      payload: [{ id: "a", type: "position", position: { x: 0, y: 0 }, dragging: true }],
    });
    expect(next.nodes[0].dragging).toBe(true);
  });

  it("adds new node at end", () => {
    const state = makeState({ nodes: [{ id: "a", position: { x: 0, y: 0 } } as any] });
    const newNode = { id: "b", position: { x: 10, y: 20 } } as any;
    const next = storeReducer(state, {
      type: "applyNodeChanges",
      payload: [{ item: newNode, type: "add" }],
    });
    expect(next.nodes).toHaveLength(2);
    expect(next.nodes[1].id).toBe("b");
  });

  it("adds new node at specific index", () => {
    const state = makeState({ nodes: [{ id: "a", position: { x: 0, y: 0 } } as any] });
    const newNode = { id: "b", position: { x: 10, y: 20 } } as any;
    const next = storeReducer(state, {
      type: "applyNodeChanges",
      payload: [{ item: newNode, type: "add", index: 0 }],
    });
    expect(next.nodes[0].id).toBe("b");
  });

  it("handles mixed changes in single batch", () => {
    const state = makeState({
      nodes: [
        { id: "a", position: { x: 0, y: 0 } } as any,
        { id: "b", position: { x: 10, y: 10 }, selected: false } as any,
      ],
    });
    const next = storeReducer(state, {
      type: "applyNodeChanges",
      payload: [
        { id: "a", type: "remove" },
        { id: "b", type: "select", selected: true },
        { item: { id: "c", position: { x: 20, y: 20 } }, type: "add" },
      ],
    });
    expect(next.nodes).toHaveLength(2);
    expect(next.nodes.map((n) => n.id)).toEqual(["b", "c"]);
    expect(next.nodes[0].selected).toBe(true);
  });

  it("no-op when changes array is empty", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "applyNodeChanges", payload: [] })).toBe(state);
  });
});

// ─── applyEdgeChanges ─────────────────────────────────────────
describe("applyEdgeChanges action", () => {
  it("removes edge by id", () => {
    const state = makeState({ edges: [{ id: "e1", source: "a", target: "b" } as any] });
    const next = storeReducer(state, {
      type: "applyEdgeChanges",
      payload: [{ id: "e1", type: "remove" }],
    });
    expect(next.edges).toHaveLength(0);
  });

  it("selects edge", () => {
    const state = makeState({
      edges: [{ id: "e1", source: "a", target: "b", selected: false } as any],
    });
    const next = storeReducer(state, {
      type: "applyEdgeChanges",
      payload: [{ id: "e1", type: "select", selected: true }],
    });
    expect(next.edges[0].selected).toBe(true);
  });

  it("adds new edge", () => {
    const state = makeState({ edges: [] });
    const newEdge = { id: "e1", source: "a", target: "b" } as any;
    const next = storeReducer(state, {
      type: "applyEdgeChanges",
      payload: [{ item: newEdge, type: "add" }],
    });
    expect(next.edges).toHaveLength(1);
    expect(next.edgeLookup.has("e1")).toBe(true);
  });

  it("adds new edge at specific index", () => {
    const state = makeState({ edges: [{ id: "e0", source: "x", target: "y" } as any] });
    const newEdge = { id: "e1", source: "a", target: "b" } as any;
    const next = storeReducer(state, {
      type: "applyEdgeChanges",
      payload: [{ item: newEdge, type: "add", index: 0 }],
    });
    expect(next.edges[0].id).toBe("e1");
  });

  it("normalizes edges after changes (auto-generates ids)", () => {
    const state = makeState({ edges: [] });
    const newEdge = { source: "a", target: "b" } as any;
    const next = storeReducer(state, {
      type: "applyEdgeChanges",
      payload: [{ item: newEdge, type: "add" }],
    });
    expect(next.edges[0].id).toBe("a-b-0");
  });

  it("rebuilds edgeLookup after changes", () => {
    const state = makeState({ edges: [] });
    const newEdge = { id: "e1", source: "a", target: "b" } as any;
    const next = storeReducer(state, {
      type: "applyEdgeChanges",
      payload: [{ item: newEdge, type: "add" }],
    });
    expect(next.edgeLookup.size).toBe(1);
    expect(next.edgeLookup.get("e1")).toBeDefined();
  });

  it("no-op when changes array is empty", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "applyEdgeChanges", payload: [] })).toBe(state);
  });
});

// ─── setMinZoom / setMaxZoom ──────────────────────────────────
describe("setMinZoom / setMaxZoom", () => {
  it("sets minZoom", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "setMinZoom", payload: 0.2 }).minZoom).toBe(0.2);
  });

  it("rejects non-finite minZoom", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "setMinZoom", payload: NaN })).toBe(state);
  });

  it("returns same state if minZoom unchanged", () => {
    const state = makeState({ minZoom: 0.5 });
    expect(storeReducer(state, { type: "setMinZoom", payload: 0.5 })).toBe(state);
  });

  it("sets maxZoom", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "setMaxZoom", payload: 5 }).maxZoom).toBe(5);
  });

  it("rejects non-finite maxZoom", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "setMaxZoom", payload: Infinity })).toBe(state);
  });
});

// ─── setInteractivity / toggleInteractivity ───────────────────
describe("setInteractivity / toggleInteractivity", () => {
  it("setInteractivity(true) enables all three flags", () => {
    const state = makeState({
      nodesSelectable: false,
      nodesDraggable: false,
      nodesConnectable: false,
    });
    const next = storeReducer(state, { type: "setInteractivity", payload: true });
    expect(next.nodesSelectable).toBe(true);
    expect(next.nodesDraggable).toBe(true);
    expect(next.nodesConnectable).toBe(true);
  });

  it("setInteractivity(false) disables all three flags", () => {
    const state = makeState();
    const next = storeReducer(state, { type: "setInteractivity", payload: false });
    expect(next.nodesSelectable).toBe(false);
    expect(next.nodesDraggable).toBe(false);
    expect(next.nodesConnectable).toBe(false);
  });

  it("rejects non-boolean payload", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "setInteractivity", payload: "yes" as any })).toBe(state);
  });

  it("toggleInteractivity flips from enabled to disabled", () => {
    const state = makeState();
    const next = storeReducer(state, { type: "toggleInteractivity" });
    expect(next.nodesSelectable).toBe(false);
    expect(next.nodesDraggable).toBe(false);
    expect(next.nodesConnectable).toBe(false);
  });

  it("toggleInteractivity flips from disabled to enabled", () => {
    const state = makeState({
      nodesSelectable: false,
      nodesDraggable: false,
      nodesConnectable: false,
    });
    const next = storeReducer(state, { type: "toggleInteractivity" });
    expect(next.nodesSelectable).toBe(true);
    expect(next.nodesDraggable).toBe(true);
    expect(next.nodesConnectable).toBe(true);
  });

  it("toggleInteractivity considers OR of all flags", () => {
    const state = makeState({
      nodesSelectable: true,
      nodesDraggable: false,
      nodesConnectable: false,
    });
    const next = storeReducer(state, { type: "toggleInteractivity" });
    expect(next.nodesSelectable).toBe(false);
    expect(next.nodesDraggable).toBe(false);
    expect(next.nodesConnectable).toBe(false);
  });
});

// ─── setStore ─────────────────────────────────────────────────
describe("setStore action", () => {
  it("sets arbitrary store key", () => {
    const state = makeState();
    const next = storeReducer(state, {
      type: "setStore",
      payload: { key: "snapToGrid", value: true },
    });
    expect(next.snapToGrid).toBe(true);
  });

  it("returns same state if value unchanged", () => {
    const state = makeState({ snapToGrid: true });
    expect(
      storeReducer(state, { type: "setStore", payload: { key: "snapToGrid", value: true } }),
    ).toBe(state);
  });

  it("when key is 'nodes', runs adoptUserNodes", () => {
    const state = makeState();
    const nodes = [{ id: "a", position: { x: 10, y: 20 }, width: 100, height: 50 }] as any[];
    const next = storeReducer(state, { type: "setStore", payload: { key: "nodes", value: nodes } });
    expect(next.nodes).toHaveLength(1);
    expect(next.nodeLookup.has("a")).toBe(true);
  });

  it("when key is 'edges', normalizes and rebuilds edgeLookup", () => {
    const state = makeState();
    const edges = [{ source: "a", target: "b" }] as any[];
    const next = storeReducer(state, { type: "setStore", payload: { key: "edges", value: edges } });
    expect(next.edges[0].id).toBe("a-b-0");
    expect(next.edgeLookup.has("a-b-0")).toBe(true);
  });
});

// ─── setConnectionStart / Move / Target / End ─────────────────
const sourceState = {
  isValid: false,
  source: {
    nodeId: "n1",
    handleId: "h1",
    type: "source" as const,
    position: "right" as const,
    x: 100,
    y: 200,
  },
  target: null,
  mousePosition: null,
};

describe("connection actions", () => {
  it("setConnectionStart stores the source handle and clears target", () => {
    const state = makeState();
    const next = storeReducer(state, {
      type: "setConnectionStart",
      payload: {
        nodeId: "n1",
        handleId: "h1",
        type: "source",
        position: "right",
        x: 100,
        y: 200,
      },
    });
    expect(next.connectionState).not.toBeNull();
    const cs = next.connectionState!;
    expect(cs.isValid).toBe(false);
    expect(cs.source.nodeId).toBe("n1");
    expect(cs.source.handleId).toBe("h1");
    expect(cs.source.type).toBe("source");
    expect(cs.source.position).toBe("right");
    expect(cs.source.x).toBe(100);
    expect(cs.source.y).toBe(200);
    expect(cs.target).toBeNull();
    expect(cs.mousePosition).toBeNull();
  });

  it("setConnectionMove updates mousePosition", () => {
    const state = makeState({ connectionState: sourceState });
    const next = storeReducer(state, {
      type: "setConnectionMove",
      payload: { clientX: 300, clientY: 400 },
    });
    expect(next.connectionState!.mousePosition).toEqual({ x: 300, y: 400 });
    expect(next.connectionState!.source.nodeId).toBe("n1");
  });

  it("setConnectionMove is a no-op without an active connection", () => {
    const state = makeState();
    expect(
      storeReducer(state, { type: "setConnectionMove", payload: { clientX: 1, clientY: 2 } }),
    ).toBe(state);
  });

  it("setConnectionTarget marks the connection valid for another node", () => {
    const state = makeState({ connectionState: sourceState });
    const next = storeReducer(state, {
      type: "setConnectionTarget",
      payload: { nodeId: "n2", handleId: "t1", type: "target", position: "left" },
    });
    expect(next.connectionState!.target!.nodeId).toBe("n2");
    expect(next.connectionState!.target!.handleId).toBe("t1");
    expect(next.connectionState!.isValid).toBe(true);
  });

  it("setConnectionTarget invalidates when target belongs to the source node", () => {
    const state = makeState({ connectionState: sourceState });
    const next = storeReducer(state, {
      type: "setConnectionTarget",
      payload: { nodeId: "n1", handleId: "t1", type: "target", position: "left" },
    });
    expect(next.connectionState!.isValid).toBe(false);
  });

  it("setConnectionTarget(null) clears the target and validity", () => {
    const state = makeState({
      connectionState: {
        ...sourceState,
        isValid: true,
        target: {
          nodeId: "n2",
          handleId: "t1",
          type: "target" as const,
          position: "left" as const,
        },
      },
    });
    const next = storeReducer(state, { type: "setConnectionTarget", payload: null });
    expect(next.connectionState!.target).toBeNull();
    expect(next.connectionState!.isValid).toBe(false);
  });

  it("setConnectionTarget is a no-op without an active connection", () => {
    const state = makeState();
    expect(
      storeReducer(state, {
        type: "setConnectionTarget",
        payload: { nodeId: "n2", handleId: "t1", type: "target", position: "left" },
      }),
    ).toBe(state);
  });

  it("setConnectionEnd clears connectionState", () => {
    const state = makeState({ connectionState: sourceState });
    const next = storeReducer(state, { type: "setConnectionEnd" });
    expect(next.connectionState).toBeNull();
  });
});

// ─── unknown action ───────────────────────────────────────────
describe("unknown action", () => {
  it("returns same state for unknown action type", () => {
    const state = makeState();
    expect(storeReducer(state, { type: "unknown" } as any)).toBe(state);
  });
});
