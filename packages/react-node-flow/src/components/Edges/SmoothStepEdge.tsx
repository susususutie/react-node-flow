import BaseEdge from "./BaseEdge";
import { type EdgeProps } from "../../types";

export default function SmoothStepEdge(props: EdgeProps) {
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
  const midX = (sourceX + targetX) / 2;

  const r = Math.min(Math.abs(targetY - sourceY) * 0.25, Math.abs(targetX - sourceX) * 0.25, 20);
  const isSourceUp = sourceY < targetY;
  const isSourceLeft = sourceX < targetX;

  const path = [
    `M ${sourceX} ${sourceY}`,
    `L ${isSourceLeft ? midX - r : midX + r} ${sourceY}`,
    `A ${r} ${r} 0 0 ${(isSourceUp && isSourceLeft) || (!isSourceUp && !isSourceLeft) ? 1 : 0} ${midX} ${sourceY + Math.sign(targetY - sourceY) * r}`,
    `L ${midX} ${targetY - Math.sign(targetY - sourceY) * r}`,
    `A ${r} ${r} 0 0 ${(isSourceUp && isSourceLeft) || (!isSourceUp && !isSourceLeft) ? 0 : 1} ${isSourceLeft ? midX + r : midX - r} ${targetY}`,
    `L ${targetX} ${targetY}`,
  ].join(" ");

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
