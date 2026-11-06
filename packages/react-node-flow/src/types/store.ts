import type { PointerEvent } from "react";
import PanZoom from "../helper/PanZoom";
import {
  type Connection,
  type ConnectionState,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeTypes,
  type PositionType,
  type Transform,
  type Viewport,
  type InternalNode,
  type NodeLookup,
  type EdgeLookup,
  type HandleType,
} from ".";

// 静态配置, 来自 props，初始化后不变（从 props 中获取初始化后恒定不变 ）
export type StoreConfig = {
  nfId: string;
  domNode: HTMLDivElement | null;
};

// data 业务状态，中低频变化（秒级/分钟级）
export type StoreData<N extends Node = Node, E extends Edge = Edge> = {
  minZoom: number;
  maxZoom: number;

  nodes: N[];
  edges: E[];
  nodesControlled: boolean;
  edgesControlled: boolean;
  nodeLookup: NodeLookup<InternalNode<N>>;
  edgeLookup: EdgeLookup<E>;
  nodeTypes: NodeTypes<N>;
  edgeTypes: EdgeTypes<E>;
  onNodesChange: ((changes: NodeChange<N>[]) => void) | null;
  onEdgesChange: ((changes: EdgeChange<E>[]) => void) | null;
  onConnect: ((connection: Connection) => void) | null;
  isValidConnection: ((connection: Connection) => boolean) | null;
  onNodeDrag: ((event: PointerEvent, node: Node, nodes: Node[]) => void) | null;
  onNodeDragStart: ((event: PointerEvent, node: Node, nodes: Node[]) => void) | null;
  onNodeDragStop: ((event: PointerEvent, node: Node, nodes: Node[]) => void) | null;
  onNodeClick: ((event: PointerEvent, node: Node) => void) | null;
  onNodeDoubleClick: ((event: PointerEvent, node: Node) => void) | null;
  onEdgeClick: ((event: PointerEvent, edge: Edge) => void) | null;
  onPaneClick: ((event: PointerEvent) => void) | null;

  defaultViewport: Viewport;
  panZoom: PanZoom | null;
  nodesConnectable: boolean;
  nodesDraggable: boolean;
  nodesSelectable: boolean;
  zoomOnScroll: boolean;
  zoomOnPinch: boolean;
  zoomOnDoubleClick: boolean;
  panOnScroll: boolean;
  preventScrolling: boolean;
  snapToGrid: boolean;
  snapGrid: [number, number];
};

// reactive 实时状态，高频变化（帧级）
export type StoreReactive = {
  transform: Transform;
  // 其他交互状态
  mousePosition: { x: number; y: number };
  selectedPoint: { x: number; y: number } | null;
  isPanning: boolean;
  connectionState: ConnectionState;
};

export type StoreStateType<N extends Node = Node, E extends Edge = Edge> = StoreConfig &
  StoreData<N, E> &
  StoreReactive;

export type StoreAction =
  | { type: "transform"; payload: StoreReactive["transform"] }
  | { type: "syncViewport"; payload: Viewport }
  // 更新节点测量尺寸
  | { type: "updateInternalNodeMeasured"; payload: { id: string; width: number; height: number } }
  | { type: "applyNodeChanges"; payload: NodeChange[] }
  | { type: "applyEdgeChanges"; payload: EdgeChange[] }
  | { type: "setMinZoom"; payload: number }
  | { type: "setMaxZoom"; payload: number }
  | { type: "setInteractivity"; payload: boolean }
  | { type: "toggleInteractivity" }
  | { type: "setPanning"; payload: boolean }
  | { type: "setPanZoom"; payload: PanZoom | null }
  | {
      type: "setStore";
      payload: { key: keyof StoreStateType; value: StoreStateType[keyof StoreStateType] };
    }
  | { type: "updateNodeInternals"; payload: Map<string, { nodeElement: HTMLDivElement }> }
  | {
      type: "setConnectionStart";
      payload: {
        nodeId: string;
        handleId: string;
        type: HandleType;
        position: PositionType;
        x: number;
        y: number;
      };
    }
  | { type: "setConnectionMove"; payload: { clientX: number; clientY: number } }
  | {
      type: "setConnectionTarget";
      payload: {
        nodeId: string;
        handleId: string;
        type: HandleType;
        position: PositionType;
      } | null;
    }
  | { type: "setConnectionEnd" };
