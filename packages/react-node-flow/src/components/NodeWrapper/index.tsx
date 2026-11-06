import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef } from "react";
import useData from "../../hooks/useData";
import useDispatch from "../../hooks/useDispatch";
import useReactive from "../../hooks/useReactive";
import NodeIdContext from "../../contexts/NodeIdContext";
import { builtinNodeTypes } from "./utils.ts";
import { createDragState, bindDocumentDragListeners, type DragState } from "../../helper/NodeDrag";
import {
  type EdgeChange,
  type NodeChange,
  type InternalNode,
  type Node,
  type XYPosition,
} from "../../types";

type NodeWrapperProps = {
  nfId: string;
  id: string;
  noDragClassName?: string;
  nodesConnectable: boolean;
  nodesDraggable: boolean;
  nodesSelectable: boolean;
  resizeObserver: ResizeObserver | null;
};

export default function NodeWrapper(props: NodeWrapperProps) {
  const {
    nfId,
    id,
    noDragClassName = "nodrag",
    nodesConnectable,
    nodesDraggable,
    nodesSelectable,
    resizeObserver,
  } = props;
  const data = useData();
  const dispatch = useDispatch();
  const reactive = useReactive();
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const cleanupDragRef = useRef<(() => void) | null>(null);
  const panZoomRef = useRef(data.panZoom);
  panZoomRef.current = data.panZoom;

  const node = data.nodeLookup.get(id) as InternalNode<Node> | undefined;
  if (!node) return null;

  const nodeInternals = node.internals;
  const nodeType = node.type || "default";
  const NodeComponent =
    data.nodeTypes[nodeType] ||
    builtinNodeTypes[nodeType as keyof typeof builtinNodeTypes] ||
    data.nodeTypes.default ||
    builtinNodeTypes.default;

  // 监听节点大小变化，更新测量数据
  useEffect(() => {
    const el = nodeRef.current;
    if (!el || node.hidden || !resizeObserver) return;

    // const update = () => {
    //   const width = el.offsetWidth;
    //   const height = el.offsetHeight;
    //   dispatch({ type: "updateInternalNodeMeasured", payload: { id, width, height } });
    // };
    resizeObserver.observe(el);

    return () => resizeObserver.unobserve(el);
  }, [resizeObserver, id, node.hidden]);

  useEffect(() => {
    return () => {
      if (cleanupDragRef.current) {
        cleanupDragRef.current();
        panZoomRef.current?.setOptions({ isInteractive: true });
        cleanupDragRef.current = null;
        dragRef.current = null;
      }
    };
  }, []);

  if (node.hidden) return null;

  const isSelectable = !!(
    node.selectable ||
    (nodesSelectable && typeof node.selectable === "undefined")
  );
  const isDeletable = true; //!!(node.deletable || (nodesDeletable && typeof node.deletable === "undefined"));
  const isDraggable = !!(
    node.draggable ||
    (nodesDraggable && typeof node.draggable === "undefined")
  );
  const isConnectable = !!(
    node.connectable ||
    (nodesConnectable && typeof node.connectable === "undefined")
  );

  const applyChanges = (nodeChanges: NodeChange[], edgeChanges: EdgeChange[]) => {
    if (nodeChanges.length > 0) data.onNodesChange?.(nodeChanges);
    if (edgeChanges.length > 0) data.onEdgesChange?.(edgeChanges);

    if (nodeChanges.length > 0 && !data.nodesControlled) {
      dispatch({ type: "applyNodeChanges", payload: nodeChanges });
    }
    if (edgeChanges.length > 0 && !data.edgesControlled) {
      dispatch({ type: "applyEdgeChanges", payload: edgeChanges });
    }
  };

  const selectNode = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isSelectable) return;

    const multi = event.shiftKey || event.metaKey || event.ctrlKey;
    const nodeChanges: NodeChange[] = [];
    const edgeChanges: EdgeChange[] = [];

    if (multi) {
      nodeChanges.push({ id, type: "select", selected: !node.selected });
      applyChanges(nodeChanges, edgeChanges);
      return;
    }

    if (node.selected) return;

    for (const n of data.nodes) {
      const selected = n.id === id;
      if (!!n.selected !== selected) {
        nodeChanges.push({ id: n.id, type: "select", selected });
      }
    }
    for (const e of data.edges) {
      if (e.id && e.selected) edgeChanges.push({ id: e.id, type: "select", selected: false });
    }

    applyChanges(nodeChanges, edgeChanges);
  };

  const isTargetInNoDrag = (target: Element): boolean => {
    const el = nodeRef.current;
    if (!el) return false;
    let current: Element | null = target;
    while (current && current !== el) {
      if (current.classList.contains(noDragClassName)) return true;
      current = current.parentElement;
    }
    return false;
  };

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = nodeRef.current;
      if (!el) return;

      const selectedIds = data.nodes.filter((n) => n.selected).map((n) => n.id);
      const moveIds = node.selected && selectedIds.length > 0 ? selectedIds : ([id] as string[]);

      const items = data.nodes
        .filter((n) => moveIds.includes(n.id))
        .map((n) => {
          const nInternal = data.nodeLookup.get(n.id);
          let parentPosition: XYPosition | undefined;
          let parentWidth: number | undefined;
          let parentHeight: number | undefined;

          if (n.parentNode) {
            const parentNode = data.nodeLookup.get(n.parentNode);
            if (parentNode) {
              parentPosition = parentNode.position;
              parentWidth = parentNode.internals.measured.width;
              parentHeight = parentNode.internals.measured.height;
            }
          }

          return {
            id: n.id,
            position: { x: n.position.x, y: n.position.y },
            extent: n.extent,
            width: nInternal?.internals.measured.width,
            height: nInternal?.internals.measured.height,
            parentPosition,
            parentWidth,
            parentHeight,
          };
        });

      dragRef.current = createDragState(event.pointerId, event.clientX, event.clientY, items);

      el.setPointerCapture(event.pointerId);

      cleanupDragRef.current = bindDocumentDragListeners(dragRef.current, {
        getZoom: () => reactive.transform[2] || 1,
        onStart: () => {
          panZoomRef.current?.setOptions({ isInteractive: false });
        },
        onChange: (nodeChanges) => {
          data.onNodesChange?.(nodeChanges);
          if (!data.nodesControlled) {
            dispatch({ type: "applyNodeChanges", payload: nodeChanges });
          }
        },
        onEnd: (nodeChanges) => {
          data.onNodesChange?.(nodeChanges);
          if (!data.nodesControlled) {
            dispatch({ type: "applyNodeChanges", payload: nodeChanges });
          }
          panZoomRef.current?.setOptions({ isInteractive: true });
          dragRef.current = null;
          cleanupDragRef.current = null;
        },
        panBy: (dx, dy) => panZoomRef.current?.panBy(dx, dy),
        getPaneRect: () => panZoomRef.current?.getBoundingClientRect() ?? null,
        snapToGrid: data.snapToGrid,
        snapGrid: data.snapGrid,
      });
    },
    [id, data, dispatch, reactive, node.selected],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    if (isTargetInNoDrag(event.target as Element)) return;

    event.preventDefault();
    event.stopPropagation();

    selectNode(event);

    if (!isDraggable) return;

    startDrag(event);
  };

  const wrapperStyle: React.CSSProperties = {
    transform: `translate(${node.position.x}px, ${node.position.y}px)`,
    zIndex: node.zIndex ?? 0,
  };

  const nodeClassName = [
    "node-flow__node",
    `node-flow__node-${nodeType}`,
    isSelectable && "selectable",
    isDraggable && "draggable",
    node.dragging && "dragging",
    node.selected && "selected",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      data-id={id}
      ref={nodeRef}
      data-flow-node=""
      onPointerDown={onPointerDown}
      style={wrapperStyle}
      className={nodeClassName}
    >
      <NodeIdContext.Provider value={id}>
        <NodeComponent
          nfId={nfId}
          id={node.id}
          type={nodeType}
          data={node.data}
          selected={!!node.selected}
          dragging={!!node.dragging}
          width={node.width}
          height={node.height}
          positionAbsoluteX={node.position.x}
          positionAbsoluteY={node.position.y}
          zIndex={nodeInternals.zIndex}
          connectable={isConnectable}
          deletable={isDeletable}
          draggable={isDraggable}
          selectable={isSelectable}
        />
      </NodeIdContext.Provider>
    </div>
  );
}
