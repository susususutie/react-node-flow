import {
  type EdgeChange,
  type Node,
  type NodeChange,
  type StoreAction,
  type StoreStateType,
  type InternalNode,
  type Handle,
  type PositionType,
  type HandleType,
} from "../types";
import PanZoom from "../helper/PanZoom";
import { adoptUserNodes, normalizeEdges } from "../helper/utils";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clampZoom(zoom: number, minZoom: number, maxZoom: number) {
  return Math.max(Math.min(zoom, maxZoom), minZoom);
}

function applyNodeChanges(
  nodes: StoreStateType["nodes"],
  changes: NodeChange[],
  edges?: StoreStateType["edges"],
): { nodes: StoreStateType["nodes"]; edgeChanges?: EdgeChange[] } {
  if (changes.length === 0) return { nodes };

  const removeIds = new Set<string>();
  const selectMap = new Map<string, boolean>();
  const positionMap = new Map<string, { x: number; y: number }>();
  const draggingMap = new Map<string, boolean>();
  const addItems: Array<{ item: StoreStateType["nodes"][number]; index?: number }> = [];

  for (const change of changes) {
    if (change.type === "remove") {
      removeIds.add(change.id);
    } else if (change.type === "select") {
      selectMap.set(change.id, change.selected);
    } else if (change.type === "position") {
      positionMap.set(change.id, change.position);
      if (typeof change.dragging === "boolean") {
        draggingMap.set(change.id, change.dragging);
      }
    } else if (change.type === "add") {
      addItems.push({ item: change.item, index: change.index });
    }
  }

  let edgeChanges: EdgeChange[] | undefined;
  if (edges && removeIds.size > 0) {
    edgeChanges = [];
    for (const edge of edges) {
      if (edge.id && (removeIds.has(edge.source) || removeIds.has(edge.target))) {
        edgeChanges.push({ id: edge.id, type: "remove" });
      }
    }
  }

  let changed = false;
  const nextNodes: StoreStateType["nodes"] = [];
  for (const node of nodes) {
    if (removeIds.has(node.id)) {
      changed = true;
      continue;
    }

    const nextSelected = selectMap.get(node.id);
    const nextPosition = positionMap.get(node.id);
    const nextDragging = draggingMap.get(node.id);

    if (nextSelected === undefined && nextPosition === undefined) {
      nextNodes.push(node);
      continue;
    }

    changed = true;
    nextNodes.push({
      ...node,
      selected: nextSelected ?? node.selected,
      position: nextPosition ? { x: nextPosition.x, y: nextPosition.y } : node.position,
      dragging: nextDragging !== undefined ? nextDragging : node.dragging,
    });
  }

  // Add new nodes
  for (const { item, index } of addItems) {
    changed = true;
    if (index !== undefined && index >= 0 && index <= nextNodes.length) {
      nextNodes.splice(index, 0, item);
    } else {
      nextNodes.push(item);
    }
  }

  return { nodes: changed ? nextNodes : nodes, edgeChanges };
}

function applyEdgeChanges(
  edges: StoreStateType["edges"],
  changes: EdgeChange[],
): StoreStateType["edges"] {
  if (changes.length === 0) return edges;

  const removeIds = new Set<string>();
  const selectMap = new Map<string, boolean>();
  const addItems: Array<{ item: StoreStateType["edges"][number]; index?: number }> = [];

  for (const change of changes) {
    if (change.type === "remove") {
      removeIds.add(change.id);
    } else if (change.type === "select") {
      selectMap.set(change.id, change.selected);
    } else if (change.type === "add") {
      addItems.push({ item: change.item, index: change.index });
    }
  }

  let changed = false;
  const nextEdges: StoreStateType["edges"] = [];
  for (const edge of edges) {
    const id = edge.id;
    if (!id) {
      nextEdges.push(edge);
      continue;
    }
    if (removeIds.has(id)) {
      changed = true;
      continue;
    }

    const nextSelected = selectMap.get(id);
    if (nextSelected === undefined) {
      nextEdges.push(edge);
      continue;
    }

    changed = true;
    nextEdges.push({ ...edge, selected: nextSelected });
  }

  // Add new edges
  for (const { item, index } of addItems) {
    changed = true;
    if (index !== undefined && index >= 0 && index <= nextEdges.length) {
      nextEdges.splice(index, 0, item);
    } else {
      nextEdges.push(item);
    }
  }

  return changed ? nextEdges : edges;
}

export default function storeReducer(state: StoreStateType, action: StoreAction): StoreStateType {
  switch (action.type) {
    case "transform": {
      const [x, y, zoom] = action.payload;

      if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(zoom)) {
        return state;
      }

      let nextZoom = zoom;
      nextZoom = clampZoom(nextZoom, state.minZoom, state.maxZoom);

      if (x === state.transform[0] && y === state.transform[1] && nextZoom === state.transform[2]) {
        return state;
      }

      return { ...state, transform: [x, y, nextZoom] };
    }
    case "syncViewport": {
      const { x, y, zoom } = action.payload;
      if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(zoom)) {
        return state;
      }
      const nextZoom = clampZoom(zoom, state.minZoom, state.maxZoom);
      if (x === state.transform[0] && y === state.transform[1] && nextZoom === state.transform[2]) {
        return state;
      }
      return { ...state, transform: [x, y, nextZoom] };
    }
    /** 更新内部节点的测量尺寸，在渲染后调用 */
    case "updateInternalNodeMeasured": {
      const { id, width, height } = action.payload;
      if (typeof id !== "string" || id.length === 0) return state;
      if (!isFiniteNumber(width) || !isFiniteNumber(height)) return state;
      if (width < 0 || height < 0) return state;

      const node = state.nodeLookup.get(id);
      if (!node) return state;
      const prevMeasured = node.internals.measured;
      if (prevMeasured && prevMeasured.width === width && prevMeasured.height === height) {
        return state;
      }

      const nextNodeLookup = new Map(state.nodeLookup);
      nextNodeLookup.set(id, {
        ...node,
        internals: { ...node.internals, measured: { width, height } },
      });
      return { ...state, nodeLookup: nextNodeLookup };
    }
    case "applyNodeChanges": {
      const { nodes: nextNodes, edgeChanges } = applyNodeChanges(
        state.nodes,
        action.payload,
        state.edges,
      );
      if (nextNodes === state.nodes && !edgeChanges) return state;
      const { nodes, nodeLookup } = adoptUserNodes(nextNodes, state.nodeLookup);
      let nextEdges = state.edges;
      if (edgeChanges && edgeChanges.length > 0) {
        nextEdges = applyEdgeChanges(state.edges, edgeChanges);
      }
      const normalized = normalizeEdges(nextEdges);
      const nextEdgeLookup = new Map(normalized.map((edge) => [edge.id!, edge]));
      return { ...state, nodes, nodeLookup, edges: normalized, edgeLookup: nextEdgeLookup };
    }
    case "applyEdgeChanges": {
      const nextEdges = applyEdgeChanges(state.edges, action.payload);
      if (nextEdges === state.edges) return state;
      const normalized = normalizeEdges(nextEdges);
      const nextEdgeLookup = new Map(normalized.map((edge) => [edge.id!, edge]));
      return { ...state, edges: normalized, edgeLookup: nextEdgeLookup };
    }
    case "setMinZoom": {
      const nextMinZoom = action.payload;
      if (!isFiniteNumber(nextMinZoom)) {
        return state;
      }
      if (nextMinZoom === state.minZoom) {
        return state;
      }
      return { ...state, minZoom: nextMinZoom };
    }
    case "setMaxZoom": {
      const nextMaxZoom = action.payload;
      if (!isFiniteNumber(nextMaxZoom)) {
        return state;
      }
      if (nextMaxZoom === state.maxZoom) {
        return state;
      }
      return { ...state, maxZoom: nextMaxZoom };
    }
    case "setInteractivity": {
      if (typeof action.payload !== "boolean") return state;
      const isInteractive = action.payload;
      return {
        ...state,
        nodesSelectable: isInteractive,
        nodesDraggable: isInteractive,
        nodesConnectable: isInteractive,
      };
    }
    case "toggleInteractivity":
      const isInteractive = state.nodesDraggable || state.nodesConnectable || state.nodesSelectable;
      return {
        ...state,
        nodesSelectable: !isInteractive,
        nodesDraggable: !isInteractive,
        nodesConnectable: !isInteractive,
      };
    case "setPanZoom": {
      if (action.payload === null) {
        if (state.panZoom === null) return state;
        return { ...state, panZoom: null };
      }
      if (!(action.payload instanceof PanZoom)) return state;
      if (action.payload === state.panZoom) return state;
      return { ...state, panZoom: action.payload };
    }
    case "setStore": {
      const { key, value } = action.payload;
      if (state[key] === value) return state;
      if (key === "nodes" && Array.isArray(value)) {
        const { nodes, nodeLookup } = adoptUserNodes(
          value as StoreStateType["nodes"],
          state.nodeLookup,
        );
        return { ...state, nodes, nodeLookup };
      }
      if (key === "edges" && Array.isArray(value)) {
        const nextEdges = normalizeEdges(value as StoreStateType["edges"]);
        const nextEdgeLookup = new Map(nextEdges.map((edge) => [edge.id!, edge]));
        return { ...state, edges: nextEdges, edgeLookup: nextEdgeLookup };
      }
      return { ...state, [key]: value };
    }
    case "updateNodeInternals": {
      const updateNodes = action.payload;

      if (updateNodes.size === 0) return state;

      const nodeLookup = state.nodeLookup;
      const newNodeLookup = new Map(nodeLookup);
      const newNodes = [...state.nodes];

      for (const [id, { nodeElement }] of updateNodes) {
        const nodeIndex = newNodes.findIndex((node) => node.id === id);
        const userNode = newNodes.find((node) => node.id === id);
        if (nodeIndex === -1) continue;

        const nodeInternals = nodeLookup.get(id);
        if (!userNode || !nodeInternals) continue;

        const width = nodeElement.offsetWidth;
        const height = nodeElement.offsetHeight;
        if (!width || !height) continue;

        const nodeRect = nodeElement.getBoundingClientRect();
        const handles = getNodeHandles(nodeElement, nodeRect, state.transform[2]);
        const newNode: Node = {
          ...userNode,
          width,
          height,
          handles: handles ?? undefined,
        };
        const newNodeInternals: InternalNode<Node> = {
          ...newNode,
          internals: {
            ...nodeInternals.internals,
            measured: { width, height },
            positionAbsolute: {
              x: newNode.position.x ?? nodeInternals.internals.positionAbsolute.x,
              y: newNode.position.y ?? nodeInternals.internals.positionAbsolute.y,
            },
            handles: handles ?? null,
          },
        };

        newNodes[nodeIndex] = newNode;
        newNodeLookup.set(id, newNodeInternals);
      }

      return {
        ...state,
        nodes: newNodes,
        nodeLookup: newNodeLookup,
      };
    }
    case "setConnectionStart": {
      return {
        ...state,
        connectionState: {
          isValid: false,
          source: action.payload,
          target: null,
          mousePosition: null,
        },
      };
    }
    case "setConnectionMove": {
      if (!state.connectionState) return state;
      return {
        ...state,
        connectionState: {
          ...state.connectionState,
          mousePosition: { x: action.payload.clientX, y: action.payload.clientY },
        },
      };
    }
    case "setConnectionTarget": {
      if (!state.connectionState) return state;
      const target = action.payload;
      const isValid = target !== null && state.connectionState.source.nodeId !== target.nodeId;
      return {
        ...state,
        connectionState: { ...state.connectionState, target, isValid },
      };
    }
    case "setConnectionEnd": {
      return { ...state, connectionState: null };
    }
    default:
      return state;
  }
}

const getNodeHandles = (
  nodeElement: HTMLDivElement,
  nodeBounds: DOMRect,
  zoom: number,
): Handle[] | null => {
  const handles = nodeElement.querySelectorAll<HTMLDivElement>('[data-role="handle"]');

  if (!handles || !handles.length) {
    return null;
  }

  return Array.from(handles).map((handle): Handle => {
    const handleRect = handle.getBoundingClientRect();

    return {
      nodeId: handle.getAttribute("data-nodeid") as string,
      id: handle.getAttribute("data-handle-id") as string,
      type: handle.getAttribute("data-handle-type") as unknown as HandleType,
      position: handle.getAttribute("data-handle-pos") as unknown as PositionType,
      x: (handleRect.left - nodeBounds.left) / zoom,
      y: (handleRect.top - nodeBounds.top) / zoom,
      width: handle.offsetWidth,
      height: handle.offsetHeight,
    };
  });
};
