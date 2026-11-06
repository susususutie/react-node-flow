import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import useData from "../hooks/useData";
import useConfig from "../hooks/useConfig";
import useDispatch from "../hooks/useDispatch";
import useReactive from "../hooks/useReactive";
import { type EdgeChange, type NodeChange } from "../types";

/**
 * @description 交互事件层
 * - 自动平移：框选接近容器边缘时触发画布自动滚动
 * - 点击 pane 空白处取消选择、重置选中元素
 * - 右键菜单、滚轮事件代理
 * - 渲染 `UserSelection`（框选矩形可视化）
 */
export default function Pane({ children }: { children: ReactNode }) {
  const config = useConfig();
  const data = useData();
  const dispatch = useDispatch();
  const reactive = useReactive();

  const paneRef = useRef<HTMLDivElement | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  const [userSelection, setUserSelection] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }>({ active: false, startX: 0, startY: 0, endX: 0, endY: 0 });
  const [isSelectionKeyPressed, setIsSelectionKeyPressed] = useState(false);

  const clearSelection = () => {
    const nodeChanges: NodeChange[] = [];
    const edgeChanges: EdgeChange[] = [];

    for (const node of data.nodes) {
      if (node.selected) nodeChanges.push({ id: node.id, type: "select", selected: false });
    }
    for (const edge of data.edges) {
      if (edge.id && edge.selected)
        edgeChanges.push({ id: edge.id, type: "select", selected: false });
    }

    if (nodeChanges.length > 0) data.onNodesChange?.(nodeChanges);
    if (edgeChanges.length > 0) data.onEdgesChange?.(edgeChanges);

    if (nodeChanges.length > 0 && !data.nodesControlled) {
      dispatch({ type: "applyNodeChanges", payload: nodeChanges });
    }
    if (edgeChanges.length > 0 && !data.edgesControlled) {
      dispatch({ type: "applyEdgeChanges", payload: edgeChanges });
    }
  };

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

  const deleteSelection = () => {
    const selectedNodeIds = new Set(data.nodes.filter((n) => n.selected).map((n) => n.id));
    const selectedEdgeIds = new Set(data.edges.filter((e) => e.id && e.selected).map((e) => e.id!));

    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;

    for (const edge of data.edges) {
      if (!edge.id) continue;
      if (selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)) {
        selectedEdgeIds.add(edge.id);
      }
    }

    const nodeChanges: NodeChange[] = [...selectedNodeIds].map((id) => ({ id, type: "remove" }));
    const edgeChanges: EdgeChange[] = [...selectedEdgeIds].map((id) => ({ id, type: "remove" }));
    applyChanges(nodeChanges, edgeChanges);
  };

  useEffect(() => {
    const el = config.domNode;
    if (!el) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        clearSelection();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        deleteSelection();
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [
    config.domNode,
    data.nodes,
    data.edges,
    data.nodesControlled,
    data.edgesControlled,
    data.onNodesChange,
    data.onEdgesChange,
    dispatch,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") setIsSelectionKeyPressed(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") setIsSelectionKeyPressed(false);
    };
    const onBlur = () => setIsSelectionKeyPressed(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const selectionBoxStyle = useMemo(() => {
    if (!userSelection.active) return null;
    const left = Math.min(userSelection.startX, userSelection.endX);
    const top = Math.min(userSelection.startY, userSelection.endY);
    const width = Math.abs(userSelection.endX - userSelection.startX);
    const height = Math.abs(userSelection.endY - userSelection.startY);
    return { left, top, width, height };
  }, [userSelection]);
  const canPan = data.panOnScroll || data.zoomOnScroll || data.zoomOnPinch;
  const cursor =
    isSelectionKeyPressed || userSelection.active
      ? "pointer"
      : reactive.isPanning
        ? "grabbing"
        : canPan
          ? "grab"
          : undefined;

  return (
    <div
      ref={paneRef}
      className="node-flow__pane"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        cursor,
        userSelect: "none",
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;

        const rect = paneRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        pointerDownRef.current = { x, y };

        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          paneRef.current?.setPointerCapture(event.pointerId);
          selectionStartRef.current = { x, y };
          setUserSelection({ active: true, startX: x, startY: y, endX: x, endY: y });
        }
      }}
      onPointerMove={(event) => {
        if (!userSelection.active) return;
        event.preventDefault();
        event.stopPropagation();

        const rect = paneRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setUserSelection((s) => ({ ...s, endX: x, endY: y }));
      }}
      onPointerUp={(event) => {
        if (event.button !== 0) return;

        const rect = paneRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (userSelection.active) {
          event.preventDefault();
          event.stopPropagation();

          const start = selectionStartRef.current;
          selectionStartRef.current = null;

          setUserSelection((s) => ({ ...s, active: false }));
          if (!start) return;

          const left = Math.min(start.x, x);
          const top = Math.min(start.y, y);
          const right = Math.max(start.x, x);
          const bottom = Math.max(start.y, y);

          const tX = reactive.transform[0];
          const tY = reactive.transform[1];
          const zoom = reactive.transform[2] || 1;

          const selectedByBox = new Set<string>();
          for (const node of data.nodes) {
            const isSelectable =
              node.selectable === true || (data.nodesSelectable && node.selectable === undefined);
            if (!isSelectable) continue;
            if (node.hidden) continue;

            const lookup = data.nodeLookup.get(node.id);
            if (!lookup) continue;

            const nodeWidth = lookup.internals.measured?.width ?? 0;
            const nodeHeight = lookup.internals.measured?.height ?? 0;

            const nLeft = tX + node.position.x * zoom;
            const nTop = tY + node.position.y * zoom;
            const nRight = nLeft + nodeWidth * zoom;
            const nBottom = nTop + nodeHeight * zoom;

            const fullyInside =
              nLeft >= left && nTop >= top && nRight <= right && nBottom <= bottom;
            if (fullyInside) selectedByBox.add(node.id);
          }

          const nodeChanges: NodeChange[] = [];
          const edgeChanges: EdgeChange[] = [];

          for (const node of data.nodes) {
            const nextSelected = selectedByBox.has(node.id);
            if (!!node.selected !== nextSelected) {
              nodeChanges.push({ id: node.id, type: "select", selected: nextSelected });
            }
          }

          for (const edge of data.edges) {
            if (!edge.id) continue;
            const nextSelected = selectedByBox.has(edge.source) && selectedByBox.has(edge.target);
            if (!!edge.selected !== nextSelected) {
              edgeChanges.push({ id: edge.id, type: "select", selected: nextSelected });
            }
          }

          applyChanges(nodeChanges, edgeChanges);
          return;
        }

        const down = pointerDownRef.current;
        pointerDownRef.current = null;
        if (!down) return;

        const dx = x - down.x;
        const dy = y - down.y;
        const moved = Math.hypot(dx, dy);
        if (moved <= 3) {
          clearSelection();
          // Fire onPaneClick if not clicking on a node
          if (data.onPaneClick) {
            const target = event.target as HTMLElement;
            if (!target.closest("[data-flow-node]")) {
              data.onPaneClick(event);
            }
          }
        }
      }}
    >
      {userSelection.active && selectionBoxStyle ? (
        <div
          style={{
            position: "absolute",
            left: selectionBoxStyle.left,
            top: selectionBoxStyle.top,
            width: selectionBoxStyle.width,
            height: selectionBoxStyle.height,
            background: "rgba(37, 99, 235, 0.08)",
            border: "1px solid rgba(37, 99, 235, 0.9)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      ) : null}
      {children}
    </div>
  );
}
