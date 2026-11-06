import { useEffect, useRef, type ReactNode, useCallback } from "react";
import useDispatch from "../hooks/useDispatch";
import useData from "../hooks/useData";
import useReactive from "../hooks/useReactive";
import PanZoom from "../helper/PanZoom";
import { type Transform, type NodeFlowPropsType, type Viewport } from "../types";

type ZoomPaneProps = {
  children: ReactNode;
  isControlledViewport: boolean;
  viewport?: Viewport;
} & Pick<NodeFlowPropsType, "onViewportChange">;

/**
 * @description 视口变换层
 * 使用 `PanZoom` 实例来控制画布所有 **pan/zoom** 操作
 * - 滚轮缩放、双指缩放、双击缩放、拖拽平移、滚动平移
 * - 负责 `transform` 状态的管理和 `onViewportChange` 回调
 * - 将 `panZoom` 实例写入 store，供其他组件（如 MiniMap、Controls）使用
 */
export default function ZoomPane(props: ZoomPaneProps) {
  const { children, isControlledViewport, onViewportChange, viewport } = props;

  const dispatch = useDispatch();
  const data = useData();
  const reactive = useReactive();

  const rootRef = useRef<HTMLDivElement | null>(null);

  const onTransformChange = useCallback(
    (transform: Transform) => {
      onViewportChange?.({ x: transform[0], y: transform[1], zoom: transform[2] });

      if (!isControlledViewport) {
        dispatch({ type: "transform", payload: transform });
      }
    },
    [onViewportChange, isControlledViewport],
  );

  const onPanStateChange = useCallback(
    (isPanning: boolean) => {
      dispatch({ type: "setPanning", payload: isPanning });
    },
    [dispatch],
  );

  const panZoom = useRef<PanZoom | null>(null);
  useEffect(() => {
    if (rootRef.current) {
      const currentViewport = {
        x: reactive.transform[0],
        y: reactive.transform[1],
        zoom: reactive.transform[2],
      };
      panZoom.current = new PanZoom({
        el: rootRef.current,
        minZoom: data.minZoom,
        maxZoom: data.maxZoom,
        viewport: currentViewport,
        zoomOnScroll: data.zoomOnScroll,
        zoomOnPinch: data.zoomOnPinch,
        zoomOnDoubleClick: data.zoomOnDoubleClick,
        panOnScroll: data.panOnScroll,
        preventScrolling: data.preventScrolling,
        onTransformChange,
        onPanStateChange,
      });
      dispatch({ type: "setPanZoom", payload: panZoom.current });
      dispatch({
        type: "setStore",
        payload: { key: "domNode", value: rootRef.current.parentElement as HTMLDivElement },
      });
      return () => {
        panZoom.current?.destroy();
        dispatch({ type: "setStore", payload: { key: "domNode", value: null } });
        dispatch({ type: "setPanZoom", payload: null });
      };
    }
  }, []);

  useEffect(() => {
    panZoom.current?.setOptions({
      minZoom: data.minZoom,
      maxZoom: data.maxZoom,
      zoomOnScroll: data.zoomOnScroll,
      zoomOnPinch: data.zoomOnPinch,
      zoomOnDoubleClick: data.zoomOnDoubleClick,
      panOnScroll: data.panOnScroll,
      preventScrolling: data.preventScrolling,
      onTransformChange,
      onPanStateChange,
    });
  }, [
    data.minZoom,
    data.maxZoom,
    data.zoomOnScroll,
    data.zoomOnPinch,
    data.zoomOnDoubleClick,
    data.panOnScroll,
    data.preventScrolling,
    onTransformChange,
    onPanStateChange,
  ]);

  useEffect(() => {
    if (!viewport) return;
    panZoom.current?.syncViewport(viewport);
  }, [viewport]);

  return (
    <div
      ref={rootRef}
      className="node-flow__renderer"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        touchAction: "none",
        overscrollBehavior: "none",
      }}
    >
      {children}
    </div>
  );
}
