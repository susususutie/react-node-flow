import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useData from "../hooks/useData";
import useReactive from "../hooks/useReactive";
import Panel from "../components/Panel";

type MiniMapProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  nodeColor?: string | ((node: any) => string);
  nodeStrokeWidth?: number;
  nodeBorderRadius?: number;
  maskColor?: string;
  style?: React.CSSProperties;
  pannable?: boolean;
};

export default function MiniMap(props: MiniMapProps) {
  const {
    position = "bottom-right",
    nodeColor = "#ddd",
    nodeStrokeWidth = 2,
    nodeBorderRadius = 2,
    maskColor = "rgba(0, 0, 0, 0.1)",
    style,
    pannable = true,
  } = props;

  const data = useData();
  const reactive = useReactive();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const mapWidth = 200;
  const mapHeight = 150;

  // Measure the parent pane container once (and on resize)
  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute bounds of all nodes
  const { bounds, nodeRects, scale } = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const rects: Array<{
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
    }> = [];

    for (const node of data.nodes) {
      if (node.hidden) continue;
      const internal = data.nodeLookup.get(node.id);
      if (!internal) continue;

      const x = internal.internals.positionAbsolute.x;
      const y = internal.internals.positionAbsolute.y;
      const w = internal.internals.measured.width ?? 0;
      const h = internal.internals.measured.height ?? 0;

      if (w === 0 || h === 0) continue;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;

      const color = typeof nodeColor === "function" ? nodeColor(node) : nodeColor;

      rects.push({ id: node.id, x, y, w, h, color });
    }

    if (minX === Infinity) {
      return {
        bounds: { x: 0, y: 0, width: 1, height: 1 },
        nodeRects: [],
        scale: 1,
      };
    }

    // Add padding
    const padX = (maxX - minX) * 0.1 || 20;
    const padY = (maxY - minY) * 0.1 || 20;
    const b = {
      x: minX - padX,
      y: minY - padY,
      width: maxX - minX + padX * 2,
      height: maxY - minY + padY * 2,
    };

    const scaleX = mapWidth / b.width;
    const scaleY = mapHeight / b.height;
    const s = Math.min(scaleX, scaleY);

    return { bounds: b, nodeRects: rects, scale: s };
  }, [data.nodes, data.nodeLookup, nodeColor, mapWidth, mapHeight]);

  const [tX, tY, zoom] = reactive.transform;

  // Compute viewport rectangle in minimap coordinates (pure math, no DOM reads)
  const viewportRect = useMemo(() => {
    const { w: paneWidth, h: paneHeight } = containerSize;
    if (paneWidth === 0 || paneHeight === 0) {
      return { x: 0, y: 0, w: 0, h: 0 };
    }

    // Convert pane coordinates to world coordinates
    const worldX = -tX / zoom;
    const worldY = -tY / zoom;
    const worldW = paneWidth / zoom;
    const worldH = paneHeight / zoom;

    // Convert to minimap coordinates
    return {
      x: (worldX - bounds.x) * scale,
      y: (worldY - bounds.y) * scale,
      w: worldW * scale,
      h: worldH * scale,
    };
  }, [tX, tY, zoom, bounds, scale, containerSize]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!pannable) return;
      event.preventDefault();
      event.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const onPointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;

        // Convert minimap coords to world coords
        const worldX = bounds.x + relX / scale;
        const worldY = bounds.y + relY / scale;

        // Convert to pane coordinates
        const paneWidth = containerSize.w;
        const paneHeight = containerSize.h;

        const newX = -worldX * zoom + paneWidth / 2;
        const newY = -worldY * zoom + paneHeight / 2;

        data.panZoom?.setViewport({ x: newX, y: newY, zoom });
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [pannable, bounds, zoom, data.panZoom, scale, containerSize],
  );

  return (
    <Panel position={position} style={style}>
      <div
        ref={containerRef}
        style={{
          width: mapWidth,
          height: mapHeight,
          border: "1px solid #ddd",
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "white",
          cursor: pannable ? "pointer" : "default",
          position: "relative",
        }}
        onPointerDown={handlePointerDown}
      >
        {/* Nodes */}
        {nodeRects.map((rect) => {
          const x = (rect.x - bounds.x) * scale;
          const y = (rect.y - bounds.y) * scale;
          const w = rect.w * scale;
          const h = rect.h * scale;

          return (
            <div
              key={rect.id}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: w,
                height: h,
                backgroundColor: rect.color,
                borderRadius: nodeBorderRadius,
                border: `${nodeStrokeWidth}px solid rgba(0,0,0,0.1)`,
              }}
            />
          );
        })}

        {/* Viewport mask */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: maskColor,
            pointerEvents: "none",
          }}
        />

        {/* Viewport indicator */}
        <div
          style={{
            position: "absolute",
            left: viewportRect.x,
            top: viewportRect.y,
            width: viewportRect.w,
            height: viewportRect.h,
            border: "2px solid #2563eb",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        />
      </div>
    </Panel>
  );
}
