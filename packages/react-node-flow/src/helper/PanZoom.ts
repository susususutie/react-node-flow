import { type Transform, type Viewport } from "../types";

type Options = {
  el: HTMLElement;
  minZoom: number;
  maxZoom: number;
  viewport: Viewport;
  onTransformChange: (transform: Transform) => void;
  onPanStateChange?: (isPanning: boolean) => void;
  isInteractive?: boolean;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  zoomOnDoubleClick?: boolean;
  panOnScroll?: boolean;
  preventScrolling?: boolean;
};

/** 参考 d3-zoom 实现一个 PanZoom 类 */
class PanZoom {
  private el: HTMLElement | null;
  private minZoom: number;
  private maxZoom: number;
  private viewport: Viewport;
  private onTransformChange: (transform: Transform) => void;
  private onPanStateChange: ((isPanning: boolean) => void) | null;
  private destroyed: boolean;
  private pointerInside: boolean;
  private isInteractive: boolean;
  private zoomOnScroll: boolean;
  private zoomOnPinch: boolean;
  private zoomOnDoubleClick: boolean;
  private panOnScroll: boolean;
  private preventScrolling: boolean;
  private cleanupFns: Array<() => void>;
  private wheelRafId: number | null;
  private pendingWheelEvent: WheelEvent | null;
  private mouseDown: boolean;
  private panStartClient: { x: number; y: number } | null;
  private panStartViewport: Viewport | null;
  private pinchStartDistance: number | null;
  private pinchStartZoom: number | null;
  private pinchStartViewport: Viewport | null;
  private lastPinchClient: { x: number; y: number } | null;
  private gestureStartZoom: number | null;

  constructor(options: Options) {
    if (!options.el) throw new Error("el is required");

    this.el = options.el;
    this.minZoom = options.minZoom;
    this.maxZoom = options.maxZoom;
    this.viewport = options.viewport;
    this.onTransformChange = options.onTransformChange;
    this.onPanStateChange = options.onPanStateChange ?? null;
    this.destroyed = false;
    this.pointerInside = false;
    this.isInteractive = options.isInteractive ?? true;
    this.zoomOnScroll = options.zoomOnScroll ?? true;
    this.zoomOnPinch = options.zoomOnPinch ?? true;
    this.zoomOnDoubleClick = options.zoomOnDoubleClick ?? true;
    this.panOnScroll = options.panOnScroll ?? false;
    this.preventScrolling = options.preventScrolling ?? true;
    this.cleanupFns = [];
    this.wheelRafId = null;
    this.pendingWheelEvent = null;
    this.mouseDown = false;
    this.panStartClient = null;
    this.panStartViewport = null;
    this.pinchStartDistance = null;
    this.pinchStartZoom = null;
    this.pinchStartViewport = null;
    this.lastPinchClient = null;
    this.gestureStartZoom = null;

    this.#bindEvents();
  }

  #bindEvents() {
    if (!this.el) return;

    const onWheel = (event: WheelEvent) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      if (!this.#shouldHandleWheel(event)) return;
      if (this.preventScrolling) event.preventDefault();
      if (!this.zoomOnScroll && !this.panOnScroll) return;

      this.pendingWheelEvent = event;
      if (this.wheelRafId != null) return;

      this.wheelRafId = window.requestAnimationFrame(() => {
        this.wheelRafId = null;
        const latestEvent = this.pendingWheelEvent;
        this.pendingWheelEvent = null;
        if (!latestEvent) return;
        this.#handleWheel(latestEvent);
      });
    };
    const captureWheelOptions = { capture: true, passive: false } as AddEventListenerOptions;
    const onWindowWheel = (event: WheelEvent) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      if (!this.preventScrolling) return;
      if (!this.pointerInside) return;
      if (this.#isNoWheelEvent(event)) return;
      event.preventDefault();
    };

    const onPointerEnter = () => {
      this.pointerInside = true;
    };

    const onPointerLeave = () => {
      this.pointerInside = false;
    };

    const onDblClick = (event: MouseEvent) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      if (!this.zoomOnDoubleClick) return;
      if (!this.#shouldHandleDoubleClick(event)) return;
      event.preventDefault();
      this.zoomIn({ x: event.clientX, y: event.clientY });
    };

    const onMouseDown = (event: MouseEvent) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest("[data-role='handle']")) return;
      this.mouseDown = true;
      this.panStartClient = { x: event.clientX, y: event.clientY };
      this.panStartViewport = { ...this.viewport };
      this.#setPanning(true);
      event.preventDefault();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      if (!this.mouseDown || !this.panStartClient || !this.panStartViewport) return;
      const dx = event.clientX - this.panStartClient.x;
      const dy = event.clientY - this.panStartClient.y;
      this.#commitViewport({
        x: this.panStartViewport.x + dx,
        y: this.panStartViewport.y + dy,
        zoom: this.panStartViewport.zoom,
      });
    };

    const onMouseUp = () => {
      if (this.destroyed) return;
      this.mouseDown = false;
      this.panStartClient = null;
      this.panStartViewport = null;
      this.#setPanning(false);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      if ((event.target as HTMLElement).closest("[data-role='handle']")) return;
      this.#handleTouchStart(event);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      this.#handleTouchMove(event);
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (this.destroyed) return;
      this.#handleTouchEnd(event);
    };

    const onTouchCancel = () => {
      if (this.destroyed) return;
      this.#resetPinch();
      this.panStartClient = null;
      this.panStartViewport = null;
      this.#setPanning(false);
    };

    const onGestureStart = (event: Event) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      if (!this.zoomOnPinch) return;
      this.#handleGestureStart(event);
    };

    const onGestureChange = (event: Event) => {
      if (this.destroyed) return;
      if (!this.isInteractive) return;
      if (!this.zoomOnPinch) return;
      this.#handleGestureChange(event);
    };

    const onGestureEnd = (event: Event) => {
      if (this.destroyed) return;
      if (!this.zoomOnPinch) return;
      this.#handleGestureEnd(event);
    };

    this.el.addEventListener("wheel", onWheel, { passive: false });
    this.cleanupFns.push(() => this.el?.removeEventListener("wheel", onWheel));
    window.addEventListener("wheel", onWindowWheel, captureWheelOptions);
    this.cleanupFns.push(() =>
      window.removeEventListener("wheel", onWindowWheel, captureWheelOptions),
    );

    this.el.addEventListener("pointerenter", onPointerEnter);
    this.el.addEventListener("pointerleave", onPointerLeave);
    this.cleanupFns.push(() => this.el?.removeEventListener("pointerenter", onPointerEnter));
    this.cleanupFns.push(() => this.el?.removeEventListener("pointerleave", onPointerLeave));

    this.el.addEventListener("dblclick", onDblClick);
    this.cleanupFns.push(() => this.el?.removeEventListener("dblclick", onDblClick));

    this.el.addEventListener("mousedown", onMouseDown);
    this.cleanupFns.push(() => this.el?.removeEventListener("mousedown", onMouseDown));
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    this.cleanupFns.push(() => window.removeEventListener("mousemove", onMouseMove));
    this.cleanupFns.push(() => window.removeEventListener("mouseup", onMouseUp));

    this.el.addEventListener("touchstart", onTouchStart, { passive: false });
    this.el.addEventListener("touchmove", onTouchMove, { passive: false });
    this.el.addEventListener("touchend", onTouchEnd);
    this.el.addEventListener("touchcancel", onTouchCancel);
    this.cleanupFns.push(() => this.el?.removeEventListener("touchstart", onTouchStart));
    this.cleanupFns.push(() => this.el?.removeEventListener("touchmove", onTouchMove));
    this.cleanupFns.push(() => this.el?.removeEventListener("touchend", onTouchEnd));
    this.cleanupFns.push(() => this.el?.removeEventListener("touchcancel", onTouchCancel));

    this.el.addEventListener(
      "gesturestart",
      onGestureStart as EventListener,
      {
        passive: false,
      } as AddEventListenerOptions,
    );
    this.el.addEventListener(
      "gesturechange",
      onGestureChange as EventListener,
      {
        passive: false,
      } as AddEventListenerOptions,
    );
    this.el.addEventListener(
      "gestureend",
      onGestureEnd as EventListener,
      {
        passive: false,
      } as AddEventListenerOptions,
    );
    this.cleanupFns.push(() =>
      this.el?.removeEventListener("gesturestart", onGestureStart as EventListener),
    );
    this.cleanupFns.push(() =>
      this.el?.removeEventListener("gesturechange", onGestureChange as EventListener),
    );
    this.cleanupFns.push(() =>
      this.el?.removeEventListener("gestureend", onGestureEnd as EventListener),
    );
  }

  #getLocalCoords(clientX: number, clientY: number) {
    const rect = this.el?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  #shouldHandleDoubleClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return true;
    if (!this.el?.contains(event.target)) return false;
    return !event.target.closest("[data-flow-node], [data-flow-edge], [data-flow-no-canvas-zoom]");
  }

  #shouldHandleWheel(event: WheelEvent) {
    if (!(event.target instanceof Element)) return true;
    if (!this.el?.contains(event.target)) return false;
    return !this.#isNoWheelEvent(event);
  }

  #isNoWheelEvent(event: WheelEvent) {
    return event.target instanceof Element && !!event.target.closest("[data-flow-no-wheel]");
  }

  #computeZoomAtClient(
    baseViewport: Viewport,
    clientX: number,
    clientY: number,
    nextZoomRaw: number,
  ): Viewport | undefined {
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoomRaw));
    const currentZoom = baseViewport.zoom;
    const currentX = baseViewport.x;
    const currentY = baseViewport.y;

    if (currentZoom === 0) return;
    if (clampedZoom === currentZoom) return;

    const { x: originX, y: originY } = this.#getLocalCoords(clientX, clientY);

    const ratio = clampedZoom / currentZoom;
    // 新偏移量计算公式
    const nextX = originX - (originX - currentX) * ratio;
    const nextY = originY - (originY - currentY) * ratio;

    return {
      x: nextX,
      y: nextY,
      zoom: clampedZoom,
    };
  }

  #zoomAtClient(clientX: number, clientY: number, nextZoomRaw: number): Viewport | undefined {
    return this.#computeZoomAtClient(this.viewport, clientX, clientY, nextZoomRaw);
  }

  #commitViewport(nextViewport: Viewport) {
    this.viewport = nextViewport;
    this.onTransformChange?.([nextViewport.x, nextViewport.y, nextViewport.zoom]);
  }

  #zoomToClient(clientX: number, clientY: number, nextZoomRaw: number): Viewport | null {
    const nextViewport = this.#zoomAtClient(clientX, clientY, nextZoomRaw);
    if (!nextViewport) return null;
    this.#commitViewport(nextViewport);
    return nextViewport;
  }

  #handleWheel(event: WheelEvent) {
    if (!this.isInteractive) return;
    const shouldZoom = this.zoomOnScroll && (!this.panOnScroll || event.ctrlKey);
    if (shouldZoom) {
      const anyEvent = event as unknown as { wheelDelta?: number };
      const wheelDelta = typeof anyEvent.wheelDelta === "number" ? anyEvent.wheelDelta : null;
      const delta = wheelDelta ?? -event.deltaY;

      const currentZoom = this.viewport.zoom;
      const scale = Math.exp(delta * 0.002);
      const nextZoomRaw = currentZoom * scale;
      this.#zoomToClient(event.clientX, event.clientY, nextZoomRaw);
      return;
    }

    if (this.panOnScroll) {
      this.#commitViewport({
        x: this.viewport.x - event.deltaX,
        y: this.viewport.y - event.deltaY,
        zoom: this.viewport.zoom,
      });
    }
  }

  #getTouchesDistance(touches: TouchList) {
    const [t1, t2] = [touches[0], touches[1]];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.hypot(dx, dy);
  }

  #getTouchesMidpoint(touches: TouchList) {
    const [t1, t2] = [touches[0], touches[1]];
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }

  #resetPinch() {
    this.pinchStartDistance = null;
    this.pinchStartZoom = null;
    this.pinchStartViewport = null;
    this.lastPinchClient = null;
  }

  #setPanning(isPanning: boolean) {
    this.onPanStateChange?.(isPanning);
  }

  #handleTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      const t = event.touches[0];
      this.panStartClient = { x: t.clientX, y: t.clientY };
      this.panStartViewport = { ...this.viewport };
      this.#setPanning(true);
      event.preventDefault();
      return;
    }

    if (event.touches.length !== 2) return;
    if (!this.zoomOnPinch) return;
    const distance = this.#getTouchesDistance(event.touches);
    if (!Number.isFinite(distance) || distance <= 0) return;

    this.pinchStartDistance = distance;
    this.pinchStartZoom = this.viewport.zoom;
    this.pinchStartViewport = { ...this.viewport };
    this.lastPinchClient = this.#getTouchesMidpoint(event.touches);
    this.panStartClient = null;
    this.panStartViewport = null;
    this.#setPanning(false);
    event.preventDefault();
  }

  #handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 1) {
      const startClient = this.panStartClient;
      const startViewport = this.panStartViewport;
      if (!startClient || !startViewport) return;

      const t = event.touches[0];
      const dx = t.clientX - startClient.x;
      const dy = t.clientY - startClient.y;
      this.#commitViewport({
        x: startViewport.x + dx,
        y: startViewport.y + dy,
        zoom: startViewport.zoom,
      });
      event.preventDefault();
      return;
    }

    if (event.touches.length !== 2) return;
    if (!this.zoomOnPinch) return;

    const startDistance = this.pinchStartDistance;
    const startZoom = this.pinchStartZoom;
    const startViewport = this.pinchStartViewport;
    if (!startDistance || !startZoom || !startViewport) return;

    const currentDistance = this.#getTouchesDistance(event.touches);
    if (!Number.isFinite(currentDistance) || currentDistance <= 0) return;

    const midpoint = this.#getTouchesMidpoint(event.touches);
    this.lastPinchClient = midpoint;

    const nextZoomRaw = startZoom * (currentDistance / startDistance);
    const nextViewport = this.#computeZoomAtClient(
      startViewport,
      midpoint.x,
      midpoint.y,
      nextZoomRaw,
    );
    if (!nextViewport) return;
    this.#commitViewport(nextViewport);
    event.preventDefault();
  }

  #handleTouchEnd(event: TouchEvent) {
    if (event.touches.length < 2) this.#resetPinch();
    if (event.touches.length === 0) {
      this.panStartClient = null;
      this.panStartViewport = null;
      this.#setPanning(false);
    }
  }

  #handleGestureStart(event: Event) {
    this.gestureStartZoom = this.viewport.zoom;
    (event as Event).preventDefault?.();
  }

  #handleGestureChange(event: Event) {
    const gestureStartZoom = this.gestureStartZoom;
    if (gestureStartZoom === null) return;
    const scale = (event as any).scale;
    if (typeof scale !== "number" || !Number.isFinite(scale) || scale <= 0) return;

    const fallbackClient = (() => {
      const rect = this.el?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })();

    const origin = this.lastPinchClient ?? fallbackClient;
    this.#zoomToClient(origin.x, origin.y, gestureStartZoom * scale);
    (event as Event).preventDefault?.();
  }

  #handleGestureEnd(event: Event) {
    this.gestureStartZoom = null;
    (event as Event).preventDefault?.();
  }

  getViewport(): Viewport {
    return this.viewport;
  }

  getBoundingClientRect(): DOMRect | null {
    return this.el?.getBoundingClientRect() ?? null;
  }

  setOptions(
    options: Partial<
      Pick<
        Options,
        | "minZoom"
        | "maxZoom"
        | "isInteractive"
        | "zoomOnScroll"
        | "zoomOnPinch"
        | "zoomOnDoubleClick"
        | "panOnScroll"
        | "preventScrolling"
        | "onTransformChange"
        | "onPanStateChange"
      >
    >,
  ) {
    if (this.destroyed) return;

    if (options.isInteractive !== undefined) {
      this.isInteractive = options.isInteractive;
      if (!this.isInteractive) {
        if (this.wheelRafId != null) window.cancelAnimationFrame(this.wheelRafId);
        this.wheelRafId = null;
        this.pendingWheelEvent = null;
        this.mouseDown = false;
        this.panStartClient = null;
        this.panStartViewport = null;
        this.#resetPinch();
        this.gestureStartZoom = null;
        this.#setPanning(false);
      }
    }

    if (options.minZoom !== undefined) this.minZoom = options.minZoom;
    if (options.maxZoom !== undefined) this.maxZoom = options.maxZoom;
    if (options.zoomOnScroll !== undefined) this.zoomOnScroll = options.zoomOnScroll;
    if (options.zoomOnPinch !== undefined) this.zoomOnPinch = options.zoomOnPinch;
    if (options.zoomOnDoubleClick !== undefined) this.zoomOnDoubleClick = options.zoomOnDoubleClick;
    if (options.panOnScroll !== undefined) this.panOnScroll = options.panOnScroll;
    if (options.preventScrolling !== undefined) this.preventScrolling = options.preventScrolling;
    if (options.onTransformChange !== undefined) this.onTransformChange = options.onTransformChange;
    if (options.onPanStateChange !== undefined) {
      this.onPanStateChange = options.onPanStateChange;
    }
  }

  setViewport(viewport: Viewport) {
    if (this.destroyed) return;
    this.#commitViewport(viewport);
  }

  syncViewport(viewport: Viewport) {
    if (this.destroyed) return;
    if (
      viewport.x === this.viewport.x &&
      viewport.y === this.viewport.y &&
      viewport.zoom === this.viewport.zoom
    ) {
      return;
    }
    this.viewport = viewport;
  }

  zoomIn(config?: { x: number; y: number }): Viewport | null {
    if (this.destroyed) return null;

    let clientX = 0;
    let clientY = 0;
    if (!config) {
      const rect = this.el?.getBoundingClientRect();
      if (!rect) return null;

      clientX = rect.width / 2 + rect.left;
      clientY = rect.height / 2 + rect.top;
    } else {
      clientX = config.x;
      clientY = config.y;
    }

    return this.#zoomToClient(clientX, clientY, this.viewport.zoom * 1.2);
  }

  zoomOut(): Viewport | null {
    if (this.destroyed) return null;
    const rect = this.el?.getBoundingClientRect();
    if (!rect) return null;

    const centerClient = {
      x: rect.width / 2 + rect.left,
      y: rect.height / 2 + rect.top,
    };

    return this.#zoomToClient(centerClient.x, centerClient.y, this.viewport.zoom * 0.8);
  }

  zoomTo(zoom: number, config?: { x: number; y: number }): Viewport | null {
    if (this.destroyed) return null;

    const zoomPoint = {
      x: config?.x || 0,
      y: config?.y || 0,
    };

    return this.#zoomToClient(zoomPoint.x, zoomPoint.y, zoom);
  }

  panBy(dx: number, dy: number) {
    if (this.destroyed) return;
    this.#commitViewport({
      x: this.viewport.x + dx,
      y: this.viewport.y + dy,
      zoom: this.viewport.zoom,
    });
  }

  fitView(
    nodes: Array<{ x: number; y: number; width: number; height: number }>,
    opts?: { padding?: number },
  ): Viewport | null {
    if (this.destroyed || nodes.length === 0) return null;

    const padding = opts?.padding ?? 0.1;
    const rect = this.el?.getBoundingClientRect();
    if (!rect) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + n.width > maxX) maxX = n.x + n.width;
      if (n.y + n.height > maxY) maxY = n.y + n.height;
    }

    const nw = maxX - minX;
    const nh = maxY - minY;
    if (nw <= 0 || nh <= 0) return null;

    const availW = rect.width * (1 - padding * 2);
    const availH = rect.height * (1 - padding * 2);

    let zoom = Math.min(availW / nw, availH / nh);
    zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const tx = rect.width / 2 - cx * zoom;
    const ty = rect.height / 2 - cy * zoom;

    this.#commitViewport({ x: tx, y: ty, zoom });
    return { x: tx, y: ty, zoom };
  }

  destroy() {
    for (const cleanupFn of this.cleanupFns) cleanupFn();
    this.cleanupFns = [];
    if (this.wheelRafId != null) window.cancelAnimationFrame(this.wheelRafId);
    this.wheelRafId = null;
    this.pendingWheelEvent = null;
    this.mouseDown = false;
    this.panStartClient = null;
    this.panStartViewport = null;
    this.#resetPinch();
    this.gestureStartZoom = null;
    this.#setPanning(false);
    this.el = null;
    this.destroyed = true;
  }
}

export default PanZoom;
