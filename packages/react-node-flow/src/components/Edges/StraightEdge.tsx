import BaseEdge from "./BaseEdge";
import { type EdgeProps } from "../../types";

export default function StraightEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    selected,
    interactionWidth,
    markerEnd,
    markerStart,
    animated,
  } = props;
  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

  return (
    <BaseEdge
      path={path}
      interactionWidth={interactionWidth}
      markerEnd={markerEnd}
      markerStart={markerStart}
      animated={animated}
      style={{ stroke: selected ? "#2563eb" : "#9ca3af", strokeWidth: 2 }}
    />
  );
}
