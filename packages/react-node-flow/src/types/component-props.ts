import { type HTMLAttributes } from "react";
import {
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeTypes,
  type Viewport,
} from ".";

/**
 * 如果使用自定义节点:
 * type MyNode = Node | CustomNode
 */
export type NodeFlowPropsType<
  N extends Node = Node,
  E extends Edge = Edge,
> = HTMLAttributes<HTMLDivElement> & {
  minZoom?: number;
  maxZoom?: number;

  /**
   * 非受控模式，默认节点，不会自动更新
   */
  defaultNodes?: N[];
  /**
   * 手动传入 nodes 时，受控模式
   */
  nodes?: N[];
  onNodesChange?: (changes: NodeChange[]) => void;
  /**
   * 是否允许节点连接。可被节点自身的 connectable 属性覆盖。
   * 默认值：true。
   */
  nodesConnectable?: boolean;
  /**
   * 是否允许节点拖动。可被节点自身的 draggable 属性覆盖。
   * 默认值：true。
   */
  nodesDraggable?: boolean;
  /**
   * 是否允许节点选择。可被节点自身的 selectable 属性覆盖。
   * 默认值：true。
   */
  nodesSelectable?: boolean;

  /**
   * 非受控模式，默认边，不会自动更新
   */
  defaultEdges?: E[];
  /**
   * 手动传入 edges 时，受控模式
   */
  edges?: E[];
  onEdgesChange?: (changes: EdgeChange[]) => void;

  /**
   * 自定义节点类型映射表。
   * key 对应 node.type，value 为用户自定义组件。
   * 必须用 useMemo 或在组件外定义，以避免每次渲染重建导致 bug。
   */
  nodeTypes?: NodeTypes<N>;
  /**
   * 自定义边类型映射表。
   * key 对应 edge.type，value 为用户自定义组件。
   * 必须用 useMemo 或在组件外定义。
   */
  edgeTypes?: EdgeTypes<E>;

  defaultViewport?: Viewport;
  /**
   * 手动传入 viewport 时，受控模式，viewport 变更时触发 onViewportChange
   */
  viewport?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;

  /**
   * 是否允许鼠标滚轮缩放。
   * 默认值：true。
   *
   * 当同时开启 panOnScroll 时：仅在按住 Ctrl 键时触发缩放，否则滚轮用于平移。
   */
  zoomOnScroll?: boolean;
  /**
   * 是否允许触摸/触控板双指捏合缩放（touch pinch 与 Safari gesture）。
   * 默认值：true。
   */
  zoomOnPinch?: boolean;
  /**
   * 是否允许双击放大。
   * 默认值：true。
   */
  zoomOnDoubleClick?: boolean;
  /**
   * 是否允许滚轮平移（根据 deltaX/deltaY）。
   * 默认值：false。
   *
   * 当同时开启 zoomOnScroll 时：滚轮默认平移，按住 Ctrl 键时滚轮缩放。
   */
  panOnScroll?: boolean;
  /**
   * 鼠标或触控板位于画布上方时是否阻止页面滚动。
   * 默认值：true。
   *
   * 给节点内部滚动区域添加 `data-flow-no-wheel` 可跳过画布滚轮处理。
   */
  preventScrolling?: boolean;

  /**
   * 连接完成时的回调
   */
  onConnect?: (connection: Connection) => void;
  /**
   * 连接验证函数。返回 false 可阻止连接。
   */
  isValidConnection?: (connection: Connection) => boolean;

  /**
   * 节点拖拽时的回调
   */
  onNodeDrag?: (event: React.PointerEvent, node: Node, nodes: Node[]) => void;
  /**
   * 节点开始拖拽时的回调
   */
  onNodeDragStart?: (event: React.PointerEvent, node: Node, nodes: Node[]) => void;
  /**
   * 节点结束拖拽时的回调
   */
  onNodeDragStop?: (event: React.PointerEvent, node: Node, nodes: Node[]) => void;
  /**
   * 节点点击回调
   */
  onNodeClick?: (event: React.PointerEvent, node: Node) => void;
  /**
   * 节点双击回调
   */
  onNodeDoubleClick?: (event: React.PointerEvent, node: Node) => void;
  /**
   * 边点击回调
   */
  onEdgeClick?: (event: React.PointerEvent, edge: Edge) => void;
  /**
   * 画布空白区域点击回调
   */
  onPaneClick?: (event: React.PointerEvent) => void;
  /**
   * 是否启用节点位置吸附到网格。默认值: false
   */
  snapToGrid?: boolean;
  /**
   * 网格大小。默认值: [15, 15]
   */
  snapGrid?: [number, number];
};
