import StoreProvider from "./components/StoreProvider";
import StoreUpdater from "./components/StoreUpdater";
import ConnectionLineWrapper from "./container/ConnectionLineWrapper";
import HandleReveal from "./container/HandleReveal";
import EdgeRenderer from "./container/EdgeRenderer";
import NodeRenderer from "./container/NodeRenderer";
import Pane from "./container/Pane";
import FlowViewport from "./container/Viewport";
import ZoomPane from "./container/ZoomPane";
import { type NodeFlowPropsType, type Viewport } from "./types";
import { memo, useId, type CSSProperties } from "react";
import "./style.css";

const initViewport: Viewport = { x: 0, y: 0, zoom: 1 };
const wrapperStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  overflow: "hidden",
  overscrollBehavior: "none",
  position: "relative",
  zIndex: 0,
};

function NodeFlow(props: NodeFlowPropsType) {
  const {
    id,
    style,
    className,
    children,
    minZoom = 0.5,
    maxZoom = 2,
    defaultNodes,
    nodes,
    onNodesChange,
    nodesConnectable,
    nodesDraggable,
    nodesSelectable,
    edges,
    defaultEdges,
    onEdgesChange,
    onConnect,
    isValidConnection,
    onNodeDrag,
    onNodeDragStart,
    onNodeDragStop,
    onNodeClick,
    onNodeDoubleClick,
    onEdgeClick,
    onPaneClick,
    snapToGrid,
    snapGrid,
    nodeTypes,
    edgeTypes,
    defaultViewport = initViewport,
    viewport,
    onViewportChange,
    zoomOnScroll,
    zoomOnPinch,
    zoomOnDoubleClick,
    panOnScroll,
    preventScrolling,
    ...rest
  } = props;

  const nfId = id ?? `NodeFlow-${useId()}`;

  return (
    <div
      {...rest}
      id={nfId}
      className={`node-flow${className ? ` ${className}` : ""}`}
      style={{ ...wrapperStyle, ...style }}
    >
      {/* 根据 props 初始化全局状态  */}
      <StoreProvider
        nfId={nfId}
        minZoom={minZoom}
        maxZoom={maxZoom}
        nodes={nodes}
        defaultNodes={defaultNodes}
        onNodesChange={onNodesChange}
        nodesConnectable={nodesConnectable}
        nodesDraggable={nodesDraggable}
        nodesSelectable={nodesSelectable}
        edges={edges}
        defaultEdges={defaultEdges}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeDrag={onNodeDrag}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        snapToGrid={snapToGrid}
        snapGrid={snapGrid}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        viewport={viewport}
        zoomOnScroll={zoomOnScroll}
        zoomOnPinch={zoomOnPinch}
        zoomOnDoubleClick={zoomOnDoubleClick}
        panOnScroll={panOnScroll}
        preventScrolling={preventScrolling}
      >
        {/* 后续 props 变更，同步到全局状态 */}
        <StoreUpdater
          nfId={nfId}
          minZoom={minZoom}
          maxZoom={maxZoom}
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onNodeDrag={onNodeDrag}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          snapToGrid={snapToGrid}
          snapGrid={snapGrid}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          viewport={viewport}
          zoomOnScroll={zoomOnScroll}
          zoomOnPinch={zoomOnPinch}
          zoomOnDoubleClick={zoomOnDoubleClick}
          panOnScroll={panOnScroll}
          preventScrolling={preventScrolling}
        />
        <ZoomPane
          isControlledViewport={!!viewport}
          viewport={viewport}
          onViewportChange={onViewportChange}
        >
          <Pane>
            <FlowViewport>
              <EdgeRenderer />
              <NodeRenderer nfId={nfId} />
            </FlowViewport>
          </Pane>
        </ZoomPane>
        <HandleReveal />
        <ConnectionLineWrapper />
        {children}
      </StoreProvider>
    </div>
  );
}

/** 深度比较 style 对象是否相等，不同应用若属性/值全相等也认为是相等 */
function styleAreEqual(
  prevStyle: undefined | null | CSSProperties,
  nextStyle: undefined | null | CSSProperties,
) {
  // 引用相同或都为 null/undefined
  if (prevStyle === nextStyle) return true;
  if (!prevStyle || !nextStyle) return false;

  // 获取所有 keys
  const prevKeys = Object.keys(prevStyle) as (keyof CSSProperties)[];
  const nextKeys = Object.keys(nextStyle) as (keyof CSSProperties)[];

  // 数量不同
  if (prevKeys.length !== nextKeys.length) return false;

  // 比较每个属性值（使用 Object.is）
  for (let key of prevKeys) {
    if (!Object.is(prevStyle[key], nextStyle[key])) {
      return false;
    }
  }

  return true;
}

// 自定义比较函数：style 深度比较，其他 props 浅比较
function propsAreEqual<P extends object>(prevProps: Readonly<P>, nextProps: Readonly<P>): boolean {
  // 快速路径：引用相同
  if (prevProps === nextProps) return true;

  // 获取所有 props keys
  const allKeys = new Set<keyof P>([
    ...(Object.keys(prevProps) as (keyof P)[]),
    ...(Object.keys(nextProps) as (keyof P)[]),
  ]);

  for (let key of allKeys) {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    // style 使用自定义比较
    if (key === ("style" as keyof P)) {
      if (!styleAreEqual(prevValue as CSSProperties, nextValue as CSSProperties)) {
        return false;
      }
    }
    // 其他 props 使用 Object.is 浅比较（React 默认方式）
    else {
      if (!Object.is(prevValue, nextValue)) {
        return false;
      }
    }
  }

  return true;
}

/** 若仅 style 发生变化，则判断内部具体是否改变 */
export default memo(NodeFlow, propsAreEqual);
