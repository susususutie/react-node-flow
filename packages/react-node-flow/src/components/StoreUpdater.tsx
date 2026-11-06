import { useEffect, useRef } from "react";
import useDispatch from "../hooks/useDispatch";
import { type NodeFlowPropsType } from "../types";
import initialState from "../store/initialState";

type StoreUpdaterProps = { nfId: string } & Pick<
  NodeFlowPropsType,
  | "minZoom"
  | "maxZoom"
  | "nodes"
  | "onNodesChange"
  | "edges"
  | "onEdgesChange"
  | "onConnect"
  | "isValidConnection"
  | "onNodeDrag"
  | "onNodeDragStart"
  | "onNodeDragStop"
  | "onNodeClick"
  | "onNodeDoubleClick"
  | "onEdgeClick"
  | "onPaneClick"
  | "snapToGrid"
  | "snapGrid"
  | "nodeTypes"
  | "edgeTypes"
  | "viewport"
  | "zoomOnScroll"
  | "zoomOnPinch"
  | "zoomOnDoubleClick"
  | "panOnScroll"
  | "preventScrolling"
>;

const fieldsToTrack = [
  "nfId",
  "minZoom",
  "maxZoom",
  "nodes",
  "onNodesChange",
  "edges",
  "onEdgesChange",
  "onConnect",
  "isValidConnection",
  "onNodeDrag",
  "onNodeDragStart",
  "onNodeDragStop",
  "onNodeClick",
  "onNodeDoubleClick",
  "onEdgeClick",
  "onPaneClick",
  "snapToGrid",
  "snapGrid",
  "nodeTypes",
  "edgeTypes",
  "viewport",
  "zoomOnScroll",
  "zoomOnPinch",
  "zoomOnDoubleClick",
  "panOnScroll",
  "preventScrolling",
] as const;
const fieldsInitialValues = {
  nfId: initialState.nfId,
  minZoom: initialState.minZoom,
  maxZoom: initialState.maxZoom,
  nodes: initialState.nodes,
  onNodesChange: initialState.onNodesChange,
  edges: initialState.edges,
  onEdgesChange: initialState.onEdgesChange,
  onConnect: initialState.onConnect,
  isValidConnection: initialState.isValidConnection,
  onNodeDrag: initialState.onNodeDrag,
  onNodeDragStart: initialState.onNodeDragStart,
  onNodeDragStop: initialState.onNodeDragStop,
  onNodeClick: initialState.onNodeClick,
  onNodeDoubleClick: initialState.onNodeDoubleClick,
  onEdgeClick: initialState.onEdgeClick,
  onPaneClick: initialState.onPaneClick,
  snapToGrid: initialState.snapToGrid,
  snapGrid: initialState.snapGrid,
  nodeTypes: initialState.nodeTypes,
  edgeTypes: initialState.edgeTypes,
  viewport: undefined,
  zoomOnScroll: initialState.zoomOnScroll,
  zoomOnPinch: initialState.zoomOnPinch,
  zoomOnDoubleClick: initialState.zoomOnDoubleClick,
  panOnScroll: initialState.panOnScroll,
  preventScrolling: initialState.preventScrolling,
};

/**
 * 监听 props 指定字段(fieldsToTrack)的变化，更新 store 中的对应数据
 */
export default function StoreUpdater(props: StoreUpdaterProps) {
  const dispatch = useDispatch();

  const previousFields = useRef<Partial<StoreUpdaterProps>>(
    fieldsInitialValues as Partial<StoreUpdaterProps>,
  );
  useEffect(() => {
    for (const fieldName of fieldsToTrack) {
      const fieldValue = props[fieldName];
      const previousFieldValue = previousFields.current[fieldName];

      if (fieldValue === previousFieldValue) continue;
      if (fieldName === "nodes") {
        dispatch({
          type: "setStore",
          payload: { key: "nodesControlled", value: fieldValue !== undefined },
        });
      }
      if (fieldName === "edges") {
        dispatch({
          type: "setStore",
          payload: { key: "edgesControlled", value: fieldValue !== undefined },
        });
      }
      if (fieldValue === undefined) continue;
      if (fieldName === "minZoom") {
        if (typeof fieldValue === "number") {
          dispatch({ type: "setMinZoom", payload: fieldValue });
        }
        continue;
      }
      if (fieldName === "maxZoom") {
        if (typeof fieldValue === "number") {
          dispatch({ type: "setMaxZoom", payload: fieldValue });
        }
        continue;
      }
      if (fieldName === "viewport") {
        dispatch({
          type: "syncViewport",
          payload: fieldValue as NonNullable<NodeFlowPropsType["viewport"]>,
        });
        continue;
      }
      dispatch({
        type: "setStore",
        payload: { key: fieldName, value: fieldValue },
      });
    }
    previousFields.current = props;
  }, [
    props.nfId,
    props.minZoom,
    props.maxZoom,
    props.nodes,
    props.onNodesChange,
    props.edges,
    props.onEdgesChange,
    props.onConnect,
    props.isValidConnection,
    props.onNodeDrag,
    props.onNodeDragStart,
    props.onNodeDragStop,
    props.onNodeClick,
    props.onNodeDoubleClick,
    props.onEdgeClick,
    props.onPaneClick,
    props.snapToGrid,
    props.snapGrid,
    props.nodeTypes,
    props.edgeTypes,
    props.viewport,
    props.zoomOnScroll,
    props.zoomOnPinch,
    props.zoomOnDoubleClick,
    props.panOnScroll,
    props.preventScrolling,
  ]);

  return null;
}
