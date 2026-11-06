import { describe, it, expect } from "vite-plus/test";
import {
  getIsNodesInitialized,
  adoptUserNodes,
  getEdgePosition,
  normalizeEdges,
} from "../../helper/utils";
import type { Edge, InternalNode, Node, NodeLookup } from "../../types";

function makeNode(id: string, overrides?: Partial<Node>): Node {
  return { id, position: { x: 0, y: 0 }, ...overrides };
}

function makeInternalNode(id: string, overrides?: Partial<InternalNode>): InternalNode {
  return {
    id,
    position: { x: 0, y: 0 },
    internals: {
      measured: { width: 100, height: 50 },
      positionAbsolute: { x: 0, y: 0 },
      zIndex: 0,
      handles: null,
      ...overrides?.internals,
    },
    ...overrides,
  } as InternalNode;
}

function makeLookup(nodes: InternalNode[]): NodeLookup {
  return new Map(nodes.map((n) => [n.id, n]));
}

// ─── getIsNodesInitialized ────────────────────────────────────
describe("getIsNodesInitialized", () => {
  it("returns false when nodeLookup is empty", () => {
    expect(getIsNodesInitialized([], new Map() as NodeLookup)).toBe(false);
  });

  it("returns false when nodes array is empty but lookup has entries", () => {
    const lookup = makeLookup([makeInternalNode("a")]);
    expect(getIsNodesInitialized([], lookup)).toBe(false);
  });

  it("returns false when measured.width is undefined", () => {
    const node = makeInternalNode("a", {
      internals: {
        measured: { width: undefined, height: 50 },
        positionAbsolute: { x: 0, y: 0 },
        zIndex: 0,
        handles: null,
      },
    });
    expect(getIsNodesInitialized([makeNode("a")], makeLookup([node]))).toBe(false);
  });

  it("returns false when measured.height is undefined", () => {
    const node = makeInternalNode("a", {
      internals: {
        measured: { width: 100, height: undefined },
        positionAbsolute: { x: 0, y: 0 },
        zIndex: 0,
        handles: null,
      },
    });
    expect(getIsNodesInitialized([makeNode("a")], makeLookup([node]))).toBe(false);
  });

  it("returns false when node has no lookup entry", () => {
    expect(getIsNodesInitialized([makeNode("missing")], new Map())).toBe(false);
  });

  it("returns true when all nodes are measured", () => {
    const lookup = makeLookup([makeInternalNode("a"), makeInternalNode("b")]);
    expect(getIsNodesInitialized([makeNode("a"), makeNode("b")], lookup)).toBe(true);
  });

  it("returns false when only one node among many is unmeasured", () => {
    const unmeasured = makeInternalNode("b", {
      internals: {
        measured: { width: undefined, height: undefined },
        positionAbsolute: { x: 0, y: 0 },
        zIndex: 0,
        handles: null,
      },
    });
    const lookup = makeLookup([makeInternalNode("a"), unmeasured]);
    expect(getIsNodesInitialized([makeNode("a"), makeNode("b")], lookup)).toBe(false);
  });
});

// ─── adoptUserNodes ───────────────────────────────────────────
describe("adoptUserNodes", () => {
  it("returns empty arrays when input nodes is empty", () => {
    const result = adoptUserNodes([], new Map() as NodeLookup);
    expect(result.nodes).toEqual([]);
    expect(result.nodeLookup.size).toBe(0);
  });

  it("preserves user node data in internal lookup", () => {
    const userNode = makeNode("a", { position: { x: 10, y: 20 }, data: { label: "test" } });
    const result = adoptUserNodes([userNode], new Map());
    const internal = result.nodeLookup.get("a");
    expect(internal).toBeDefined();
    expect(internal!.id).toBe("a");
    expect(internal!.position).toEqual({ x: 10, y: 20 });
  });

  it("carries over measured dimensions from prior lookup", () => {
    const prev = makeInternalNode("a", {
      internals: {
        measured: { width: 80, height: 40 },
        positionAbsolute: { x: 0, y: 0 },
        zIndex: 0,
        handles: null,
      },
    });
    const userNode = makeNode("a");
    const result = adoptUserNodes([userNode], makeLookup([prev]));
    const internal = result.nodeLookup.get("a");
    expect(internal!.internals.measured).toEqual({ width: 80, height: 40 });
  });

  it("user-provided width/height overrides existing measured values", () => {
    const prev = makeInternalNode("a", {
      internals: {
        measured: { width: 80, height: 40 },
        positionAbsolute: { x: 0, y: 0 },
        zIndex: 0,
        handles: null,
      },
    });
    const userNode = makeNode("a", { width: 200, height: 100 });
    const result = adoptUserNodes([userNode], makeLookup([prev]));
    const internal = result.nodeLookup.get("a");
    expect(internal!.internals.measured).toEqual({ width: 200, height: 100 });
  });

  it("computes positionAbsolute from user node position (no parent)", () => {
    const userNode = makeNode("a", { position: { x: 30, y: 40 } });
    const result = adoptUserNodes([userNode], new Map());
    const internal = result.nodeLookup.get("a");
    expect(internal!.internals.positionAbsolute).toEqual({ x: 30, y: 40 });
  });

  it("computes positionAbsolute by walking up parent chain", () => {
    const parent = makeNode("parent", { position: { x: 100, y: 200 } });
    const child = makeNode("child", { position: { x: 10, y: 20 }, parentNode: "parent" });
    const prevLookup = makeLookup([
      makeInternalNode("parent", {
        internals: {
          measured: { width: 100, height: 100 },
          positionAbsolute: { x: 100, y: 200 },
          zIndex: 0,
          handles: null,
        },
      }),
    ]);
    const result = adoptUserNodes([parent, child], prevLookup);
    const childInternal = result.nodeLookup.get("child");
    expect(childInternal!.internals.positionAbsolute).toEqual({ x: 110, y: 220 });
  });

  it("applies origin offset [0.5, 0.5] (center origin)", () => {
    const userNode = makeNode("a", {
      position: { x: 100, y: 100 },
      origin: [0.5, 0.5],
      width: 80,
      height: 60,
    });
    const result = adoptUserNodes([userNode], new Map());
    const internal = result.nodeLookup.get("a");
    // absolute = position + originOffset = 100 + (-80*0.5) = 60
    expect(internal!.internals.positionAbsolute.x).toBe(60);
    expect(internal!.internals.positionAbsolute.y).toBe(70);
  });

  it("sets nodesInitialized to true when all nodes are measured", () => {
    const nodes = [
      makeNode("a", { width: 100, height: 50 }),
      makeNode("b", { width: 80, height: 40 }),
    ];
    const result = adoptUserNodes(nodes, new Map());
    expect(result.nodesInitialized).toBe(true);
  });

  it("sets nodesInitialized to false when any node lacks dimensions", () => {
    const nodes = [makeNode("a", { width: 100, height: 50 }), makeNode("b")];
    const result = adoptUserNodes(nodes, new Map());
    expect(result.nodesInitialized).toBe(false);
  });

  it("returns new Map reference (immutability)", () => {
    const prev = makeLookup([makeInternalNode("a")]);
    const result = adoptUserNodes([makeNode("a")], prev);
    expect(result.nodeLookup).not.toBe(prev);
  });
});

// ─── getEdgePosition ──────────────────────────────────────────
describe("getEdgePosition", () => {
  function makeNodeWithHandles(
    id: string,
    handles: Array<{ id: string; type: "source" | "target"; x: number; y: number }>,
  ): InternalNode {
    return {
      id,
      position: { x: 0, y: 0 },
      internals: {
        measured: { width: 100, height: 100 },
        positionAbsolute: { x: 0, y: 0 },
        zIndex: 0,
        handles: handles.map((h) => ({
          ...h,
          nodeId: id,
          position: "right" as const,
          width: 10,
          height: 10,
        })),
      },
    } as InternalNode;
  }

  it("returns null when source node has no handles", () => {
    const source = { id: "s", internals: { handles: null } } as InternalNode;
    const target = makeNodeWithHandles("t", [{ id: "h1", type: "target", x: 0, y: 0 }]);
    expect(getEdgePosition(source, target, null, null)).toBeNull();
  });

  it("returns null when target node has no handles", () => {
    const source = makeNodeWithHandles("s", [{ id: "h1", type: "source", x: 0, y: 0 }]);
    const target = { id: "t", internals: { handles: null } } as InternalNode;
    expect(getEdgePosition(source, target, null, null)).toBeNull();
  });

  it("returns null when sourceHandle id not found", () => {
    const source = makeNodeWithHandles("s", [{ id: "h1", type: "source", x: 0, y: 0 }]);
    const target = makeNodeWithHandles("t", [{ id: "h1", type: "target", x: 0, y: 0 }]);
    expect(getEdgePosition(source, target, "nonexistent", null)).toBeNull();
  });

  it("uses first source handle when sourceHandle is null", () => {
    const source = makeNodeWithHandles("s", [
      { id: "h1", type: "source", x: 10, y: 20 },
      { id: "h2", type: "source", x: 30, y: 40 },
    ]);
    const target = makeNodeWithHandles("t", [{ id: "h1", type: "target", x: 0, y: 0 }]);
    const result = getEdgePosition(source, target, null, null);
    expect(result).not.toBeNull();
    // handle 坐标是左上角，连线锚点取 handle 中心 (+ width/2, + height/2)
    expect(result!.sourceX).toBe(15);
    expect(result!.sourceY).toBe(25);
  });

  it("computes correct absolute coordinates", () => {
    const source = {
      id: "s",
      position: { x: 100, y: 200 },
      internals: {
        measured: { width: 100, height: 100 },
        positionAbsolute: { x: 100, y: 200 },
        zIndex: 0,
        handles: [
          {
            id: "h",
            type: "source",
            nodeId: "s",
            position: "right",
            x: 50,
            y: 25,
            width: 10,
            height: 10,
          },
        ],
      },
    } as InternalNode;
    const target = {
      id: "t",
      position: { x: 300, y: 400 },
      internals: {
        measured: { width: 100, height: 100 },
        positionAbsolute: { x: 300, y: 400 },
        zIndex: 0,
        handles: [
          {
            id: "h",
            type: "target",
            nodeId: "t",
            position: "left",
            x: 0,
            y: 25,
            width: 10,
            height: 10,
          },
        ],
      },
    } as InternalNode;
    const result = getEdgePosition(source, target, null, null);
    // 锚点为 handle 中心：absolute + handle 偏移 + 尺寸的一半
    expect(result).toEqual({
      sourceX: 155,
      sourceY: 230,
      targetX: 305,
      targetY: 430,
      sourcePosition: "right",
      targetPosition: "left",
    });
  });
});

// ─── normalizeEdges ───────────────────────────────────────────
describe("normalizeEdges", () => {
  it("returns same reference when all edges have ids", () => {
    const edges = [{ id: "e1", source: "a", target: "b" }] as Edge[];
    expect(normalizeEdges(edges)).toBe(edges);
  });

  it("generates id as source-target-index when edge has no id", () => {
    const edges = [{ source: "a", target: "b" }] as Edge[];
    const result = normalizeEdges(edges);
    expect(result[0].id).toBe("a-b-0");
  });

  it("handles mixed edges with and without ids", () => {
    const edges = [
      { id: "e1", source: "a", target: "b" },
      { source: "c", target: "d" },
    ] as Edge[];
    const result = normalizeEdges(edges);
    expect(result[0].id).toBe("e1");
    expect(result[1].id).toBe("c-d-1");
  });

  it("returns new array only when changes were made", () => {
    const edges = [{ source: "a", target: "b" }] as Edge[];
    const result = normalizeEdges(edges);
    expect(result).not.toBe(edges);
  });

  it("handles empty edges array", () => {
    expect(normalizeEdges([])).toEqual([]);
  });
});
