import {
  type Edge,
  type EdgePosition,
  type Handle,
  HandleTypeEnum,
  type InternalNode,
  type Node,
  type NodeLookup,
} from "../types";

export function getIsNodesInitialized<N extends Node>(
  nodes: N[],
  nodeLookup: NodeLookup<InternalNode<N>>,
): boolean {
  if (nodeLookup.size === 0) {
    return false;
  }

  let nodesInitialized = nodes.length > 0;

  for (const userNode of nodes) {
    let internalNode = nodeLookup.get(userNode.id);

    // 尺寸还未测量出来，说明节点初始化未完成
    if (
      !internalNode ||
      internalNode.internals.measured.width === undefined ||
      internalNode.internals.measured.height === undefined
    ) {
      nodesInitialized = false;
      break;
    }
  }

  return nodesInitialized;
}

/**
 * 将用户提供的节点转换为内部节点
 * @param nodes 用户传入的nodes/defaultNodes数据
 * @param nodeLookup 处理过的内部节点数据
 */
export function adoptUserNodes<N extends Node>(
  nodes: N[],
  nodeLookup: NodeLookup<InternalNode<N>>,
): {
  nodesInitialized: boolean;
  nodes: N[];
  nodeLookup: NodeLookup<InternalNode<N>>;
} {
  const newNodeLookup: NodeLookup<InternalNode<N>> = new Map();
  const newNodes: N[] = [];
  let nodesInitialized = nodes.length > 0;

  // First pass: build lookup with basic data (no positionAbsolute yet)
  for (const userNode of nodes) {
    let internalNode = nodeLookup.get(userNode.id);
    internalNode = {
      ...internalNode,
      ...userNode,
      internals: {
        ...internalNode?.internals,
        measured: {
          width: userNode?.width ?? internalNode?.internals?.measured?.width,
          height: userNode?.height ?? internalNode?.internals?.measured?.height,
        },
        positionAbsolute: {
          x: userNode.position?.x ?? internalNode?.internals?.positionAbsolute?.x ?? 0,
          y: userNode.position?.y ?? internalNode?.internals?.positionAbsolute?.y ?? 0,
        },
        handles: parseHandles(userNode, internalNode?.internals?.handles || null),
        zIndex: userNode.zIndex ?? 0,
        parentId: userNode.parentNode,
      },
    };

    // 尺寸还未测量出来，说明节点初始化未完成
    if (
      internalNode.internals.measured.width === undefined ||
      internalNode.internals.measured.height === undefined
    ) {
      nodesInitialized = false;
    }

    newNodeLookup.set(userNode.id, internalNode);
    newNodes.push(userNode);
  }

  // Second pass: resolve parent positions and compute absolute coordinates
  for (const userNode of newNodes) {
    const internal = newNodeLookup.get(userNode.id);
    if (!internal) continue;

    const originX = userNode.origin?.[0] ?? 0;
    const originY = userNode.origin?.[1] ?? 0;
    const width = internal.internals.measured.width ?? 0;
    const height = internal.internals.measured.height ?? 0;

    // Compute absolute position by walking up the parent chain
    let offsetX = 0;
    let offsetY = 0;
    let currentParentId = userNode.parentNode;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) break;
      visited.add(currentParentId);
      const parent = newNodeLookup.get(currentParentId);
      if (!parent) break;

      offsetX += parent.position.x;
      offsetY += parent.position.y;

      currentParentId = parent.parentNode;
    }

    // Apply origin offset: origin translates the node's local origin
    // origin [0, 0] = top-left, [1, 1] = bottom-right
    const originOffsetX = -width * originX;
    const originOffsetY = -height * originY;

    internal.internals.positionAbsolute = {
      x: userNode.position.x + offsetX + originOffsetX,
      y: userNode.position.y + offsetY + originOffsetY,
    };
  }

  return { nodesInitialized, nodes: newNodes, nodeLookup: newNodeLookup };
}

function parseHandles(userNode: Node, internalHandles: Handle[] | null) {
  if (!userNode.handles) {
    return internalHandles || [];
  }
  return userNode.handles
    .map((h) => {
      const internalHandle = internalHandles ? internalHandles.find((i) => i.id === h.id) : null;

      return {
        id: h.id,
        type: h.type,
        nodeId: userNode.id,
        position: h.position,
        x: h.x ?? internalHandle?.x,
        y: h.y ?? internalHandle?.y,
        width: h.width ?? internalHandle?.width,
        height: h.height ?? internalHandle?.height,
      };
    })
    .filter(
      (h) =>
        h.width !== undefined && h.height !== undefined && h.x !== undefined && h.y !== undefined,
    ) as Handle[];
}

export function getEdgePosition(
  sourceNode: InternalNode,
  targetNode: InternalNode,
  sourceHandle: string | null,
  targetHandle: string | null,
): EdgePosition | null {
  const sHandles = sourceNode.internals.handles?.filter((h) => h.type === HandleTypeEnum.Source);
  const tHandles = targetNode.internals.handles?.filter((h) => h.type === HandleTypeEnum.Target);
  if (!sHandles || !tHandles) return null;

  const sHandle = sourceHandle === null ? sHandles[0] : sHandles.find((h) => h.id === sourceHandle);
  const tHandle = targetHandle === null ? tHandles[0] : tHandles.find((h) => h.id === targetHandle);
  if (!sHandle || !tHandle) return null;

  return {
    sourceX: sourceNode.internals.positionAbsolute.x + sHandle.x + sHandle.width / 2,
    sourceY: sourceNode.internals.positionAbsolute.y + sHandle.y + sHandle.height / 2,
    targetX: targetNode.internals.positionAbsolute.x + tHandle.x + tHandle.width / 2,
    targetY: targetNode.internals.positionAbsolute.y + tHandle.y + tHandle.height / 2,
    sourcePosition: sHandle.position,
    targetPosition: tHandle.position,
  };
}

export function normalizeEdges<E extends Edge>(edges: E[]): E[] {
  let changed = false;
  const nextEdges = edges.map((edge, index) => {
    if (edge.id) return edge;
    changed = true;
    return { ...edge, id: `${edge.source}-${edge.target}-${index}` };
  });
  return changed ? nextEdges : edges;
}
