import useReactive from "../hooks/useReactive";
import useDispatch from "../hooks/useDispatch";
import useData from "../hooks/useData";
import { useEffect, useRef } from "react";
import type { Connection, Edge, EdgeChange } from "../types";

function getConnectionEdgeIdBase(connection: Connection) {
  const sourceHandle = connection.sourceHandle ?? "null";
  const targetHandle = connection.targetHandle ?? "null";
  return `${connection.source}-${sourceHandle}-${connection.target}-${targetHandle}`;
}

function getConnectionEdgeId(connection: Connection, edges: Edge[]) {
  const baseId = getConnectionEdgeIdBase(connection);
  const usedIds = new Set(edges.map((edge) => edge.id));

  if (!usedIds.has(baseId)) return baseId;

  let index = 1;
  let nextId = `${baseId}-${index}`;
  while (usedIds.has(nextId)) {
    index += 1;
    nextId = `${baseId}-${index}`;
  }
  return nextId;
}

function createDefaultEdge(connection: Connection, edges: Edge[]): Edge {
  return {
    id: getConnectionEdgeId(connection, edges),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
  };
}

export default function ConnectionLineWrapper() {
  const reactive = useReactive();
  const dispatch = useDispatch();
  const data = useData();
  const paneRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(reactive.connectionState);
  stateRef.current = reactive.connectionState;
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    paneRef.current = document.querySelector<HTMLDivElement>(".node-flow__pane");
  }, []);

  const source = reactive.connectionState?.source;
  const sourceKey = source ? JSON.stringify([source.nodeId, source.handleId]) : null;

  useEffect(() => {
    if (!sourceKey) return;

    const onPointerMove = (event: PointerEvent) => {
      dispatch({
        type: "setConnectionMove",
        payload: { clientX: event.clientX, clientY: event.clientY },
      });

      const el = document.elementFromPoint(event.clientX, event.clientY);
      const handleEl = el?.closest<HTMLDivElement>("[data-role='handle']");
      if (handleEl) {
        const nid = handleEl.getAttribute("data-nodeid") || "";
        const hid = handleEl.getAttribute("data-handle-id") || "";
        const htype = handleEl.getAttribute("data-handle-type") || "";
        const hpos = handleEl.getAttribute("data-handle-pos") || "";
        if (htype === "target") {
          dispatch({
            type: "setConnectionTarget",
            payload: { nodeId: nid, handleId: hid, type: htype as any, position: hpos as any },
          });
          return;
        }
      }
      dispatch({ type: "setConnectionTarget", payload: null });
    };

    const onPointerUp = () => {
      const state = stateRef.current;
      if (state?.target && state.isValid) {
        const connection: Connection = {
          source: state.source.nodeId,
          target: state.target.nodeId,
          sourceHandle: state.source.handleId,
          targetHandle: state.target.handleId,
        };
        const d = dataRef.current;

        d.onConnect?.(connection);

        if (!d.edgesControlled) {
          const edgeChanges: EdgeChange[] = [
            { type: "add", item: createDefaultEdge(connection, d.edges) },
          ];
          d.onEdgesChange?.(edgeChanges);
          dispatch({ type: "applyEdgeChanges", payload: edgeChanges });
        }
      }
      dispatch({ type: "setConnectionEnd" });
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [sourceKey, dispatch]);

  const cs = reactive.connectionState;
  if (!cs?.source) return null;

  const pane = paneRef.current;
  const paneRect = pane?.getBoundingClientRect();
  if (!paneRect) return null;

  const x1 = cs.source.x - paneRect.left;
  const y1 = cs.source.y - paneRect.top;
  const mx = cs.mousePosition ? cs.mousePosition.x - paneRect.left : x1;
  const my = cs.mousePosition ? cs.mousePosition.y - paneRect.top : y1;
  const midX = (x1 + mx) / 2;
  const path = `M ${x1} ${y1} C ${midX} ${y1} ${midX} ${my} ${mx} ${my}`;

  return (
    <svg
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <path
        d={path}
        fill="none"
        stroke={cs.isValid ? "#2563eb" : "#ef4444"}
        strokeWidth={2}
        strokeDasharray="5 5"
      />
    </svg>
  );
}
