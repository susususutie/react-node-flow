import BaseEdge from "./BaseEdge";
import { type EdgeProps } from "../../types";

export default function SimpleBezierEdge(props: EdgeProps) {
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
  const sourceControlX = sourceX;
  const sourceControlY = (sourceY + targetY) / 2;
  const targetControlX = targetX;
  const targetControlY = (sourceY + targetY) / 2;
  const path = `M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceControlY} ${targetControlX} ${targetControlY} ${targetX} ${targetY}`;

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
