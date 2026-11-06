import BaseEdge from "./BaseEdge";
import { type EdgeProps, Position, type PositionType } from "../../types";

export default function BezierEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    animated,
    interactionWidth,
    markerEnd,
    markerStart,
  } = props;
  const { path } = getBezierPath(
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  );

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

function calculateControlOffset(distance: number, curvature: number): number {
  if (distance >= 0) {
    return 0.5 * distance;
  }

  return curvature * 25 * Math.sqrt(-distance);
}

function getControlPoint({
  pos,
  x1,
  y1,
  x2,
  y2,
  c,
}: {
  pos: PositionType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  c: number;
}): [number, number] {
  switch (pos) {
    case Position.Left:
      return [x1 - calculateControlOffset(x1 - x2, c), y1];
    case Position.Right:
      return [x1 + calculateControlOffset(x2 - x1, c), y1];
    case Position.Top:
      return [x1, y1 - calculateControlOffset(y1 - y2, c)];
    case Position.Bottom:
      return [x1, y1 + calculateControlOffset(y2 - y1, c)];
  }
}

function getBezierPath(
  sourceX: number,
  sourceY: number,
  sourcePosition: PositionType = Position.Bottom,
  targetX: number,
  targetY: number,
  targetPosition: PositionType = Position.Top,
  curvature: number = 0.25,
): { path: string } {
  const [sourceControlX, sourceControlY] = getControlPoint({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    c: curvature,
  });
  const [targetControlX, targetControlY] = getControlPoint({
    pos: targetPosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    c: curvature,
  });
  return {
    path: `M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceControlY} ${targetControlX} ${targetControlY} ${targetX} ${targetY}`,
  };
}
