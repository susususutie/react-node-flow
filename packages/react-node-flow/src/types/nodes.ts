import type { Handle, PositionType, XYPosition } from ".";
import type { CSSProperties, ComponentType } from "react";
import type { HandleType } from ".";

export type NodeBase<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined,
> = {
  /** unique id */
  id: string;
  /** node type, include builtin type and custom type */
  type?: NodeType;
  /** Parent node id for sub-flows */
  parentNode?: string;
  /** Origin offset: [x, y] where 0,0 is top-left, 1,1 is bottom-right. Default [0, 0] */
  origin?: [number, number];
  /** Extent constraint: "parent" restricts to parent bounds, or explicit { left, top, right, bottom } */
  extent?: "parent" | { left: number; top: number; right: number; bottom: number };
  // 节点相对于画布或父节点的坐标
  position: XYPosition;
  /** business data */
  data?: NodeData;
  /** handles for node */
  handles?: {
    id: string;
    type: HandleType;
    position: PositionType;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }[];
  // 传入宽高，则按固定宽高渲染，否则尺寸不固定，渲染完成后再测量
  width?: number;
  height?: number;
  hidden?: boolean;
  zIndex?: number;

  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;

  dragging?: boolean;
  selected?: boolean;
};

/** 用户输入的节点类型, 包含业务数据和节点配置，节点配置可能为空 */
export type Node<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends string | undefined = string | undefined,
> = NodeBase<NodeData, NodeType> & {
  style?: CSSProperties;
  className?: string;
};

/** 内部存储的节点类型，包含测量信息和处理后的非空节点配置 */
export type InternalNode<N extends Node = Node> = N & {
  internals: {
    // 实际测量尺寸
    measured: { width?: number; height?: number };
    // 画布上的绝对坐标，根据父节点位置、节点自身 origin 和 extent 约束计算而来
    positionAbsolute: XYPosition;
    zIndex: number;
    handles: Handle[] | null;
    // Parent node id (resolved from user node)
    parentId?: string;
  };
};

/** 节点类型映射表 */
export type NodeTypes<N extends Node = Node> = Record<string, ComponentType<NodeProps<N>>>;

export type NodeLookup<N extends InternalNode = InternalNode> = Map<string, N>;

/**
 * 注入给自定义节点的 props， 包含节点的基本信息和处理后的非空节点配置
 * @example
 * ```tsx
 *
 *export type CounterNode = Node<{ initialCount?: number }, 'counter'>;
 *
 *export default function CounterNode(props: NodeProps<CounterNode>) {
 *  const [count, setCount] = useState(props.data?.initialCount ?? 0);
 *
 *  return (
 *    <>
 *      <p>Count: {count}</p>
 *      <button onClick={() => setCount(count + 1)}>
 *        Increment
 *      </button>
 *    </>
 *  );
 *}
 *```
 */
export type NodeProps<N extends Node = Node> = Pick<
  N,
  "id" | "data" | "width" | "height" | "style" | "className"
> &
  Required<
    Pick<
      N,
      | "type"
      | "draggable"
      | "selectable"
      | "connectable"
      | "deletable"
      | "dragging"
      | "selected"
      | "zIndex"
    >
  > & {
    nfId: string;
    /** Whether a node is connectable or not. */
    positionAbsoluteX: number;
    positionAbsoluteY: number;
  };
