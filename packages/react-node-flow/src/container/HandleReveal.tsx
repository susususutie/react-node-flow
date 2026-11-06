import { useEffect, useRef } from "react";
import useConfig from "../hooks/useConfig";
import useReactive from "../hooks/useReactive";
import "./HandleReveal.css";

/** 连线拖拽时，指针附近多大范围内的 target 句柄需要显示（屏幕像素） */
const REVEAL_RADIUS = 80;

type HandleBox = {
  el: HTMLElement;
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** 是否为 target 句柄（拖拽中只接受 target 作为落点） */
  isTarget: boolean;
  /** 是否为本次连线的起点句柄 */
  isSource: boolean;
};

/**
 * 按需显示句柄：
 * - 平时隐藏，避免常显干扰节点展示
 * - 悬停节点时由 CSS 露出该节点的句柄（可发现性）
 * - 连线拖拽中，仅起点句柄与指针附近的 target 句柄显示
 *
 * 本组件只操作 class，不触发任何 React 重渲染。
 */
export default function HandleReveal() {
  const config = useConfig();
  const reactive = useReactive();
  const source = reactive.connectionState?.source ?? null;
  const mousePosition = reactive.connectionState?.mousePosition ?? null;
  const [tx, ty, tz] = reactive.transform;
  const boxesRef = useRef<HandleBox[]>([]);

  // 连线进行中：在画布根节点打标记，供 CSS 区分状态
  useEffect(() => {
    const root = config.domNode;
    if (!root) return;
    root.classList.toggle("nf-connecting", source !== null);
  }, [config.domNode, source]);

  // 拖拽开始或视口变化时缓存句柄屏幕位置；
  // 指针移动阶段只做距离计算，避免每帧 querySelector/getBoundingClientRect 触发强制重排。
  useEffect(() => {
    const root = config.domNode;
    if (!root) return;
    boxesRef.current = Array.from(root.querySelectorAll<HTMLElement>('[data-role="handle"]')).map(
      (el) => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          isTarget: el.dataset.handleType === "target",
          isSource:
            source !== null &&
            el.dataset.nodeid === source.nodeId &&
            el.dataset.handleId === source.handleId,
        };
      },
    );
  }, [config.domNode, source, tx, ty, tz]);

  // 指针移动：亮起附近的 target 句柄与起点句柄；拖拽结束统一清理
  useEffect(() => {
    const boxes = boxesRef.current;
    if (!source) {
      for (const box of boxes) {
        box.el.classList.remove("nf-handle-near", "nf-handle-source");
      }
      return;
    }

    const x = mousePosition?.x ?? source.x;
    const y = mousePosition?.y ?? source.y;
    for (const box of boxes) {
      const dx = Math.max(box.left - x, 0, x - box.right);
      const dy = Math.max(box.top - y, 0, y - box.bottom);
      const near = box.isTarget && Math.hypot(dx, dy) <= REVEAL_RADIUS;
      box.el.classList.toggle("nf-handle-near", near);
      box.el.classList.toggle("nf-handle-source", box.isSource);
    }
  }, [source, mousePosition]);

  return null;
}
