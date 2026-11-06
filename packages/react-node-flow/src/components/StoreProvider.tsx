import { useMemo, useReducer, type ReactNode } from "react";
import ConfigContext from "../contexts/ConfigContext";
import DataContext from "../contexts/DataContext";
import DispatchContext from "../contexts/DispatchContext";
import ReactiveContext from "../contexts/ReactiveContext";
import initialState from "../store/initialState";
import storeReducer from "../store/storeReducer";
import { type NodeFlowPropsType, type StoreAction, type StoreStateType } from "../types";
import { adoptUserNodes, normalizeEdges } from "../helper/utils";

type StoreProviderProps = {
  nfId: string;
  children: ReactNode;
} & Pick<
  NodeFlowPropsType,
  | "minZoom"
  | "maxZoom"
  | "defaultNodes"
  | "nodes"
  | "onNodesChange"
  | "nodesConnectable"
  | "nodesDraggable"
  | "nodesSelectable"
  | "defaultEdges"
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
  | "defaultViewport"
  | "viewport"
  | "nodeTypes"
  | "edgeTypes"
  | "zoomOnScroll"
  | "zoomOnPinch"
  | "zoomOnDoubleClick"
  | "panOnScroll"
  | "preventScrolling"
  | "snapToGrid"
  | "snapGrid"
>;

function initState(props: StoreProviderProps): StoreStateType {
  const minZoom = props.minZoom ?? initialState.minZoom;
  const maxZoom = props.maxZoom ?? initialState.maxZoom;

  const edges = normalizeEdges(props.edges ?? props.defaultEdges ?? initialState.edges);
  const resolvedDefaultViewport = props.defaultViewport ?? initialState.defaultViewport;
  const zoomOnScroll = props.zoomOnScroll ?? initialState.zoomOnScroll;
  const zoomOnPinch = props.zoomOnPinch ?? initialState.zoomOnPinch;
  const zoomOnDoubleClick = props.zoomOnDoubleClick ?? initialState.zoomOnDoubleClick;
  const panOnScroll = props.panOnScroll ?? initialState.panOnScroll;
  const preventScrolling = props.preventScrolling ?? initialState.preventScrolling;
  const isControlled = props.viewport !== undefined;
  const resolvedInitialViewport = props.viewport ?? resolvedDefaultViewport;
  const initialZoom = isControlled
    ? resolvedInitialViewport.zoom
    : Math.max(Math.min(resolvedInitialViewport.zoom, maxZoom), minZoom);
  const clampedDefaultZoom = Math.max(Math.min(resolvedDefaultViewport.zoom, maxZoom), minZoom);
  const nodesConnectable = props.nodesConnectable ?? initialState.nodesConnectable;
  const nodesDraggable = props.nodesDraggable ?? initialState.nodesDraggable;
  const nodesSelectable = props.nodesSelectable ?? initialState.nodesSelectable;

  const { nodesInitialized, nodes, nodeLookup } = adoptUserNodes(
    props.nodes ?? props.defaultNodes ?? initialState.nodes,
    initialState.nodeLookup,
  );

  const state = {
    ...initialState,
    nfId: props.nfId,
    minZoom,
    maxZoom,
    nodes,
    edges,
    nodesControlled: props.nodes !== undefined,
    edgesControlled: props.edges !== undefined,
    nodesConnectable,
    nodesDraggable,
    nodesSelectable,
    nodesInitialized,
    nodeLookup,
    edgeLookup: new Map(edges.map((edge) => [edge.id!, edge])),
    nodeTypes: (props.nodeTypes ?? initialState.nodeTypes) as StoreStateType["nodeTypes"],
    edgeTypes: (props.edgeTypes ?? initialState.edgeTypes) as StoreStateType["edgeTypes"],
    onNodesChange: props.onNodesChange ?? null,
    onEdgesChange: props.onEdgesChange ?? null,
    onConnect: props.onConnect ?? null,
    isValidConnection: props.isValidConnection ?? null,
    onNodeDrag: props.onNodeDrag ?? null,
    onNodeDragStart: props.onNodeDragStart ?? null,
    onNodeDragStop: props.onNodeDragStop ?? null,
    onNodeClick: props.onNodeClick ?? null,
    onNodeDoubleClick: props.onNodeDoubleClick ?? null,
    onEdgeClick: props.onEdgeClick ?? null,
    onPaneClick: props.onPaneClick ?? null,
    defaultViewport: {
      x: resolvedDefaultViewport.x,
      y: resolvedDefaultViewport.y,
      zoom: clampedDefaultZoom,
    },
    zoomOnScroll,
    zoomOnPinch,
    zoomOnDoubleClick,
    panOnScroll,
    preventScrolling,
    snapToGrid: props.snapToGrid ?? initialState.snapToGrid,
    snapGrid: props.snapGrid ?? initialState.snapGrid,
    transform: [resolvedInitialViewport.x, resolvedInitialViewport.y, initialZoom] as [
      number,
      number,
      number,
    ],
    connectionState: initialState.connectionState,
  };
  return state;
}

export default function StoreProvider(props: StoreProviderProps) {
  const { children } = props;
  const [state, dispatch] = useReducer<StoreStateType, StoreProviderProps, [StoreAction]>(
    storeReducer,
    props,
    initState,
  );

  // useMemo 稳定各层的引用
  const configValue = useMemo(
    () => ({ nfId: state.nfId, domNode: state.domNode }),
    [state.nfId, state.domNode],
  );
  const dataValue = useMemo(
    () => ({
      minZoom: state.minZoom,
      maxZoom: state.maxZoom,
      nodes: state.nodes,
      edges: state.edges,
      nodesControlled: state.nodesControlled,
      edgesControlled: state.edgesControlled,
      nodesConnectable: state.nodesConnectable,
      nodesDraggable: state.nodesDraggable,
      nodesSelectable: state.nodesSelectable,
      nodeLookup: state.nodeLookup,
      edgeLookup: state.edgeLookup,
      nodeTypes: state.nodeTypes,
      edgeTypes: state.edgeTypes,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      isValidConnection: state.isValidConnection,
      onNodeDrag: state.onNodeDrag,
      onNodeDragStart: state.onNodeDragStart,
      onNodeDragStop: state.onNodeDragStop,
      onNodeClick: state.onNodeClick,
      onNodeDoubleClick: state.onNodeDoubleClick,
      onEdgeClick: state.onEdgeClick,
      onPaneClick: state.onPaneClick,
      defaultViewport: state.defaultViewport,
      panZoom: state.panZoom,
      zoomOnScroll: state.zoomOnScroll,
      zoomOnPinch: state.zoomOnPinch,
      zoomOnDoubleClick: state.zoomOnDoubleClick,
      panOnScroll: state.panOnScroll,
      preventScrolling: state.preventScrolling,
      snapToGrid: state.snapToGrid,
      snapGrid: state.snapGrid,
    }),
    [
      state.minZoom,
      state.maxZoom,
      state.nodes,
      state.edges,
      state.nodesControlled,
      state.edgesControlled,
      state.nodesConnectable,
      state.nodesDraggable,
      state.nodesSelectable,
      state.nodeLookup,
      state.edgeLookup,
      state.nodeTypes,
      state.edgeTypes,
      state.onNodesChange,
      state.onEdgesChange,
      state.onConnect,
      state.isValidConnection,
      state.onNodeDrag,
      state.onNodeDragStart,
      state.onNodeDragStop,
      state.onNodeClick,
      state.onNodeDoubleClick,
      state.onEdgeClick,
      state.onPaneClick,
      state.defaultViewport.x,
      state.defaultViewport.y,
      state.defaultViewport.zoom,
      state.panZoom,
      state.zoomOnScroll,
      state.zoomOnPinch,
      state.zoomOnDoubleClick,
      state.panOnScroll,
      state.preventScrolling,
      state.snapToGrid,
      state.snapGrid,
    ],
  );
  const reactiveValue = useMemo(
    () => ({
      transform: state.transform,
      mousePosition: { x: state.mousePosition.x, y: state.mousePosition.y },
      selectedPoint: state.selectedPoint
        ? { x: state.selectedPoint.x, y: state.selectedPoint.y }
        : null,
      isPanning: state.isPanning,
      connectionState: state.connectionState,
    }),
    [
      state.transform[0],
      state.transform[1],
      state.transform[2],
      state.mousePosition.x,
      state.mousePosition.y,
      state.selectedPoint?.x,
      state.selectedPoint?.y,
      state.isPanning,
      state.connectionState,
    ],
  );

  return (
    <DispatchContext.Provider value={dispatch}>
      <ConfigContext.Provider value={configValue}>
        <DataContext.Provider value={dataValue}>
          <ReactiveContext.Provider value={reactiveValue}>{children}</ReactiveContext.Provider>
        </DataContext.Provider>
      </ConfigContext.Provider>
    </DispatchContext.Provider>
  );
}
