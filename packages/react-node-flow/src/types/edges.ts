import type { CSSProperties, ComponentType, ReactNode } from "react";
import { type Marker, type PositionType } from ".";

export type EdgePosition = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: PositionType;
  targetPosition: PositionType;
};

export type EdgeBase<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined,
> = {
  /** unique id */
  id: string;
  /** edge type, include builtin type and custom type */
  type?: EdgeType;
  data?: EdgeData;

  /** source node id */
  source: string;
  /** target node id */
  target: string;
  // 对应节点的 Handle id
  sourceHandle?: string | null;
  targetHandle?: string | null;

  hidden?: boolean;
  animated?: boolean;
  deletable?: boolean;
  selectable?: boolean;
  zIndex?: number;

  selected?: boolean;
  interactionWidth?: number;
  markerEnd?: Marker | string;
  markerStart?: Marker | string;
};

export type Edge<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  EdgeType extends string | undefined = string | undefined,
> = EdgeBase<EdgeData, EdgeType> & {
  style?: CSSProperties;
  className?: string;
  /** Edge label displayed at the midpoint */
  label?: string | ReactNode;
  /** Label style */
  labelStyle?: CSSProperties;
  /** Label background style */
  labelBgStyle?: CSSProperties;
  /** Whether to show label background. Default true */
  labelShowBg?: boolean;
};

/** 边类型映射表 */
export type EdgeTypes<E extends Edge = Edge> = Record<string, ComponentType<EdgeProps<E>>>;

export type EdgeLookup<E extends EdgeBase = EdgeBase> = Map<string, E>;

/**
 * 注入给自定义边的 props
 * @public
 */
export type EdgeProps<E extends Edge = Edge> = Pick<
  E,
  | "id"
  | "type"
  | "animated"
  | "data"
  | "style"
  | "selected"
  | "source"
  | "target"
  | "selectable"
  | "deletable"
  | "markerEnd"
  | "markerStart"
> &
  EdgePosition &
  // EdgeLabelOptions &
  {
    interactionWidth?: number;
    markerEnd?: string;
    markerStart?: string;
  };
