import { getEdgePosition } from "../../helper/utils";
import useData from "../../hooks/useData";
import useDispatch from "../../hooks/useDispatch";
import { type Edge, type EdgeChange, type InternalNode, type NodeChange } from "../../types";
import { builtinEdgeTypes } from "./utils";
import { renderMarkerDef, resolveMarkerUrl, MARKER_DEFAULTS } from "../Edges/markers";
import type { BuiltinMarkerType } from "../../types";

type EdgeWrapperProps = {
  id: string;
};

function EdgeLabel({
  label,
  labelStyle,
  labelBgStyle,
  labelShowBg,
  x,
  y,
}: {
  label: string | React.ReactNode;
  labelStyle?: React.CSSProperties;
  labelBgStyle?: React.CSSProperties;
  labelShowBg?: boolean;
  x: number;
  y: number;
}) {
  const showBg = labelShowBg !== false;
  return (
    <foreignObject
      x={x - 10}
      y={y - 10}
      width={1}
      height={1}
      style={{ overflow: "visible", pointerEvents: "none" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          lineHeight: 1,
          padding: "2px 6px",
          borderRadius: 4,
          ...(showBg
            ? { backgroundColor: "white", border: "1px solid #ccc", ...labelBgStyle }
            : {}),
          ...labelStyle,
        }}
      >
        {label}
      </div>
    </foreignObject>
  );
}

export default function EdgeWrapper(props: EdgeWrapperProps) {
  const { id } = props;
  const data = useData();
  const dispatch = useDispatch();
  const { nodeLookup, edgeLookup } = data;

  const edge = edgeLookup.get(id) as Edge | undefined;
  if (!edge || edge.hidden) return null;

  const source = nodeLookup.get(edge.source) as InternalNode | undefined;
  const target = nodeLookup.get(edge.target) as InternalNode | undefined;
  if (!source || !target) return null;

  const edgePosition = getEdgePosition(
    source,
    target,
    edge.sourceHandle || null,
    edge.targetHandle || null,
  );

  if (!edgePosition) return null;

  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = edgePosition;

  const edgeType = edge.type || "default";
  const EdgeComponent =
    data.edgeTypes[edgeType] ||
    builtinEdgeTypes[edgeType as keyof typeof builtinEdgeTypes] ||
    data.edgeTypes.default ||
    builtinEdgeTypes.default;

  const markerDefs: React.ReactNode[] = [];
  let resolvedMarkerEnd: string | undefined;
  let resolvedMarkerStart: string | undefined;

  function resolveEdgeMarker(
    raw: unknown,
    defType: BuiltinMarkerType,
    set: (url: string | undefined) => void,
  ): void {
    if (!raw) {
      const d = MARKER_DEFAULTS[defType];
      markerDefs.push(renderMarkerDef(defType, d.color, d.width, d.height));
      set(resolveMarkerUrl({ type: defType }));
      return;
    }
    if (typeof raw === "string") {
      set(raw);
      return;
    }
    const m = raw as any;
    if (m.type === "custom") {
      const color = m.color ?? "#9ca3af";
      const width = m.width ?? 20;
      const height = m.height ?? 20;
      const safeId = `marker-custom-${color}-${width}-${height}`.replace(/[^a-zA-Z0-9#-]/g, "_");
      markerDefs.push(
        <marker
          key={safeId}
          id={safeId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth={width}
          markerHeight={height}
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          {m.render({ color, width, height })}
        </marker>,
      );
      set(`url(#${safeId})`);
      return;
    }
    const d = MARKER_DEFAULTS[m.type as BuiltinMarkerType] ?? MARKER_DEFAULTS.arrowclosed;
    const color = m.color ?? d.color;
    const width = m.width ?? d.width;
    const height = m.height ?? d.height;
    markerDefs.push(renderMarkerDef(m.type as BuiltinMarkerType, color, width, height));
    set(resolveMarkerUrl({ type: m.type as BuiltinMarkerType, color, width, height }));
  }

  if (edge.markerEnd) {
    resolveEdgeMarker(edge.markerEnd, "arrowclosed", (url) => {
      resolvedMarkerEnd = url;
    });
  }
  if (edge.markerStart) {
    resolveEdgeMarker(edge.markerStart, "arrowclosed", (url) => {
      resolvedMarkerStart = url;
    });
  }

  const handleSelect = (event: React.PointerEvent) => {
    if (!edge.id) return;
    if (edge.selectable === false) return;
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const multi = event.shiftKey || event.metaKey || event.ctrlKey;
    const edgeChanges: EdgeChange[] = [];
    const nodeChanges: NodeChange[] = [];

    if (multi) {
      edgeChanges.push({ id: edge.id, type: "select", selected: !edge.selected });
    } else {
      for (const e of data.edges) {
        const isTarget = e.id === edge.id;
        if (e.id && !!e.selected !== isTarget) {
          edgeChanges.push({ id: e.id, type: "select", selected: isTarget });
        }
      }
      for (const n of data.nodes) {
        if (n.selected) nodeChanges.push({ id: n.id, type: "select", selected: false });
      }
    }

    if (nodeChanges.length > 0) data.onNodesChange?.(nodeChanges);
    if (edgeChanges.length > 0) data.onEdgesChange?.(edgeChanges);

    if (nodeChanges.length > 0 && !data.nodesControlled) {
      dispatch({ type: "applyNodeChanges", payload: nodeChanges });
    }
    if (edgeChanges.length > 0 && !data.edgesControlled) {
      dispatch({ type: "applyEdgeChanges", payload: edgeChanges });
    }

    // Fire onEdgeClick callback
    data.onEdgeClick?.(event, edge);
  };

  const interactionWidth = edge.interactionWidth ?? 20;

  // Compute label position (midpoint of the edge)
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  return (
    <svg
      key={id}
      data-flow-edge=""
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        overflow: "visible",
        zIndex: edge.zIndex ?? (edge.selected ? 1 : 0),
      }}
      className={`node-flow__edge node-flow__edge-${edgeType}`}
    >
      {markerDefs.length > 0 && <defs>{markerDefs}</defs>}
      <g onPointerDown={handleSelect} style={{ cursor: "pointer" }}>
        <EdgeComponent
          id={edge.id}
          type={edgeType}
          data={edge.data}
          selected={!!edge.selected}
          source={edge.source}
          target={edge.target}
          sourceX={sourceX}
          sourceY={sourceY}
          targetX={targetX}
          targetY={targetY}
          sourcePosition={sourcePosition}
          targetPosition={targetPosition}
          animated={edge.animated}
          interactionWidth={interactionWidth}
          markerEnd={resolvedMarkerEnd}
          markerStart={resolvedMarkerStart}
        />
        {edge.label && (
          <EdgeLabel
            label={edge.label}
            labelStyle={edge.labelStyle}
            labelBgStyle={edge.labelBgStyle}
            labelShowBg={edge.labelShowBg}
            x={labelX}
            y={labelY}
          />
        )}
      </g>
    </svg>
  );
}
