import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";
import PanZoom from "../../helper/PanZoom";

function createElement(): HTMLElement {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    toJSON: () => {},
  });
  document.body.appendChild(el);
  return el;
}

function createPanZoom(overrides?: Record<string, unknown>) {
  const el = createElement();
  const onTransformChange = vi.fn();
  const pz = new PanZoom({
    el,
    minZoom: 0.1,
    maxZoom: 4,
    viewport: { x: 0, y: 0, zoom: 1 },
    onTransformChange,
    ...overrides,
  });
  return { pz, el, onTransformChange };
}

// ─── Constructor & lifecycle ──────────────────────────────────
describe("PanZoom constructor", () => {
  it("throws if el is missing", () => {
    expect(
      () =>
        new PanZoom({
          el: null as any,
          minZoom: 0.1,
          maxZoom: 4,
          viewport: { x: 0, y: 0, zoom: 1 },
          onTransformChange: vi.fn(),
        }),
    ).toThrow("el is required");
  });

  it("initializes with provided viewport", () => {
    const { pz } = createPanZoom({ viewport: { x: 10, y: 20, zoom: 2 } });
    expect(pz.getViewport()).toEqual({ x: 10, y: 20, zoom: 2 });
    pz.destroy();
  });

  it("destroy removes all listeners and nulls internal state", () => {
    const { pz, el, onTransformChange } = createPanZoom();
    pz.destroy();
    // After destroy, events should be ignored
    el.dispatchEvent(
      new WheelEvent("wheel", { deltaY: -100, clientX: 400, clientY: 300, bubbles: true }),
    );
    expect(onTransformChange).not.toHaveBeenCalled();
  });
});

// ─── zoomIn / zoomOut / zoomTo ────────────────────────────────
describe("PanZoom zoom methods", () => {
  it("zoomIn multiplies zoom by 1.2", () => {
    const { pz } = createPanZoom();
    pz.zoomIn({ x: 400, y: 300 });
    expect(pz.getViewport().zoom).toBeCloseTo(1.2, 5);
    pz.destroy();
  });

  it("zoomOut multiplies zoom by 0.8", () => {
    const { pz } = createPanZoom();
    pz.zoomOut();
    expect(pz.getViewport().zoom).toBeCloseTo(0.8, 5);
    pz.destroy();
  });

  it("zoomTo sets exact zoom value", () => {
    const { pz } = createPanZoom();
    pz.zoomTo(2.5, { x: 0, y: 0 });
    expect(pz.getViewport().zoom).toBe(2.5);
    pz.destroy();
  });

  it("clamps zoom to minZoom", () => {
    const { pz } = createPanZoom({ minZoom: 0.5 });
    pz.zoomTo(0.1, { x: 0, y: 0 });
    expect(pz.getViewport().zoom).toBe(0.5);
    pz.destroy();
  });

  it("clamps zoom to maxZoom", () => {
    const { pz } = createPanZoom({ maxZoom: 3 });
    pz.zoomTo(10, { x: 0, y: 0 });
    expect(pz.getViewport().zoom).toBe(3);
    pz.destroy();
  });

  it("zoomIn returns null when destroyed", () => {
    const { pz } = createPanZoom();
    pz.destroy();
    expect(pz.zoomIn()).toBeNull();
  });

  it("zoomOut returns null when destroyed", () => {
    const { pz } = createPanZoom();
    pz.destroy();
    expect(pz.zoomOut()).toBeNull();
  });

  it("zoomTo returns null when destroyed", () => {
    const { pz } = createPanZoom();
    pz.destroy();
    expect(pz.zoomTo(2)).toBeNull();
  });
});

// ─── panBy ────────────────────────────────────────────────────
describe("PanZoom panBy", () => {
  it("translates viewport by dx, dy", () => {
    const { pz } = createPanZoom();
    pz.panBy(50, 30);
    expect(pz.getViewport()).toEqual({ x: 50, y: 30, zoom: 1 });
    pz.destroy();
  });

  it("no-op when destroyed", () => {
    const { pz } = createPanZoom();
    pz.destroy();
    pz.panBy(50, 30);
    expect(pz.getViewport()).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});

// ─── fitView ──────────────────────────────────────────────────
describe("PanZoom fitView", () => {
  it("returns null when destroyed", () => {
    const { pz } = createPanZoom();
    pz.destroy();
    expect(pz.fitView([{ x: 0, y: 0, width: 100, height: 100 }])).toBeNull();
  });

  it("returns null when bounds have zero width", () => {
    const { pz } = createPanZoom();
    expect(pz.fitView([{ x: 0, y: 0, width: 0, height: 100 }])).toBeNull();
    pz.destroy();
  });

  it("returns null when bounds have zero height", () => {
    const { pz } = createPanZoom();
    expect(pz.fitView([{ x: 0, y: 0, width: 100, height: 0 }])).toBeNull();
    pz.destroy();
  });

  it("centers bounds in viewport", () => {
    const { pz, onTransformChange } = createPanZoom();
    const result = pz.fitView([{ x: 100, y: 100, width: 200, height: 200 }]);
    expect(result).not.toBeNull();
    expect(onTransformChange).toHaveBeenCalled();
    const viewport = pz.getViewport();
    // bounds center is (200, 200); viewport center is (400, 300)
    // zoom = min(640/200, 480/200, 4) = 2.4
    // x = 400 - 200*2.4 = -80, y = 300 - 200*2.4 = -180
    expect(viewport.x).toBe(-80);
    expect(viewport.y).toBe(-180);
    expect(viewport.zoom).toBe(2.4);
    pz.destroy();
  });

  it("clamps zoom to maxZoom when content is small", () => {
    const { pz } = createPanZoom({ maxZoom: 2 });
    pz.fitView([{ x: 0, y: 0, width: 1, height: 1 }]);
    expect(pz.getViewport().zoom).toBeLessThanOrEqual(2);
    pz.destroy();
  });

  it("clamps zoom to minZoom when content is large", () => {
    const { pz } = createPanZoom({ minZoom: 0.5 });
    pz.fitView([{ x: 0, y: 0, width: 10000, height: 10000 }]);
    expect(pz.getViewport().zoom).toBeGreaterThanOrEqual(0.5);
    pz.destroy();
  });
});

// ─── setViewport / syncViewport ───────────────────────────────
describe("PanZoom setViewport / syncViewport", () => {
  it("setViewport updates viewport and fires onTransformChange", () => {
    const { pz, onTransformChange } = createPanZoom();
    pz.setViewport({ x: 50, y: 60, zoom: 2 });
    expect(pz.getViewport()).toEqual({ x: 50, y: 60, zoom: 2 });
    expect(onTransformChange).toHaveBeenCalledWith([50, 60, 2]);
    pz.destroy();
  });

  it("syncViewport updates only when viewport actually changed", () => {
    const { pz, onTransformChange } = createPanZoom();
    pz.syncViewport({ x: 0, y: 0, zoom: 1 }); // same as initial
    expect(onTransformChange).not.toHaveBeenCalled();
    pz.destroy();
  });

  it("syncViewport does not fire onTransformChange", () => {
    const { pz, onTransformChange } = createPanZoom();
    pz.syncViewport({ x: 10, y: 20, zoom: 1.5 });
    expect(onTransformChange).not.toHaveBeenCalled();
    expect(pz.getViewport()).toEqual({ x: 10, y: 20, zoom: 1.5 });
    pz.destroy();
  });

  it("syncViewport no-op when destroyed", () => {
    const { pz } = createPanZoom();
    pz.destroy();
    pz.syncViewport({ x: 10, y: 20, zoom: 1.5 });
    expect(pz.getViewport()).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});

// ─── setOptions ───────────────────────────────────────────────
describe("PanZoom setOptions", () => {
  it("updates minZoom / maxZoom", () => {
    const { pz } = createPanZoom();
    pz.setOptions({ minZoom: 0.2, maxZoom: 5 });
    // Test by zooming to the new limits
    pz.zoomTo(0.1, { x: 0, y: 0 });
    expect(pz.getViewport().zoom).toBe(0.2);
    pz.zoomTo(10, { x: 0, y: 0 });
    expect(pz.getViewport().zoom).toBe(5);
    pz.destroy();
  });

  it("no-op when destroyed", () => {
    const { pz, onTransformChange } = createPanZoom();
    pz.destroy();
    pz.setOptions({ minZoom: 0.5 });
    pz.zoomIn({ x: 0, y: 0 }); // should be ignored
    expect(onTransformChange).not.toHaveBeenCalled();
  });
});

// ─── Mouse drag pan ───────────────────────────────────────────
describe("PanZoom mouse drag pan", () => {
  it("mousedown + mousemove pans viewport", () => {
    const { pz, el } = createPanZoom();
    el.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 100, clientY: 100, button: 0, bubbles: true }),
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 150, clientY: 120, bubbles: true }),
    );
    const viewport = pz.getViewport();
    expect(viewport.x).toBe(50);
    expect(viewport.y).toBe(20);
    expect(viewport.zoom).toBe(1);
    pz.destroy();
  });

  it("only responds to left button", () => {
    const { pz, el, onTransformChange } = createPanZoom();
    el.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 100, clientY: 100, button: 2, bubbles: true }),
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 150, clientY: 120, bubbles: true }),
    );
    expect(onTransformChange).not.toHaveBeenCalled();
    pz.destroy();
  });

  it("mouseup clears pan state", () => {
    const { pz, el } = createPanZoom();
    el.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 100, clientY: 100, button: 0, bubbles: true }),
    );
    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    // Second mousemove should not pan
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 200, clientY: 200, bubbles: true }),
    );
    expect(pz.getViewport()).toEqual({ x: 0, y: 0, zoom: 1 });
    pz.destroy();
  });

  it("fires onPanStateChange on mousedown/mouseup", () => {
    const onPanStateChange = vi.fn();
    const { pz, el } = createPanZoom({ onPanStateChange });
    el.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 100, clientY: 100, button: 0, bubbles: true }),
    );
    expect(onPanStateChange).toHaveBeenCalledWith(true);
    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    expect(onPanStateChange).toHaveBeenCalledWith(false);
    pz.destroy();
  });
});

// ─── Double-click zoom ────────────────────────────────────────
describe("PanZoom double-click zoom", () => {
  it("double-click zooms in", () => {
    const { pz, el } = createPanZoom();
    el.dispatchEvent(new MouseEvent("dblclick", { clientX: 400, clientY: 300, bubbles: true }));
    expect(pz.getViewport().zoom).toBeCloseTo(1.2, 5);
    pz.destroy();
  });

  it("ignores double-click when zoomOnDoubleClick is false", () => {
    const { pz, el, onTransformChange } = createPanZoom({ zoomOnDoubleClick: false });
    el.dispatchEvent(new MouseEvent("dblclick", { clientX: 400, clientY: 300, bubbles: true }));
    expect(onTransformChange).not.toHaveBeenCalled();
    pz.destroy();
  });

  it("ignores double-click on [data-flow-node] element", () => {
    const { pz, el, onTransformChange } = createPanZoom();
    const node = document.createElement("div");
    node.setAttribute("data-flow-node", "");
    el.appendChild(node);
    node.dispatchEvent(new MouseEvent("dblclick", { clientX: 400, clientY: 300, bubbles: true }));
    expect(onTransformChange).not.toHaveBeenCalled();
    pz.destroy();
  });
});

// ─── Wheel zoom ───────────────────────────────────────────────
describe("PanZoom wheel zoom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("zooms on wheel when zoomOnScroll is true", () => {
    const { pz, el } = createPanZoom();
    el.dispatchEvent(
      new WheelEvent("wheel", { deltaY: -100, clientX: 400, clientY: 300, bubbles: true }),
    );
    vi.runAllTimers();
    expect(pz.getViewport().zoom).toBeGreaterThan(1);
    pz.destroy();
  });

  it("pans on wheel when panOnScroll is true", () => {
    const { pz, el } = createPanZoom({ panOnScroll: true, zoomOnScroll: false });
    el.dispatchEvent(
      new WheelEvent("wheel", {
        deltaX: 50,
        deltaY: 30,
        clientX: 400,
        clientY: 300,
        bubbles: true,
      }),
    );
    vi.runAllTimers();
    const viewport = pz.getViewport();
    expect(viewport.x).toBe(-50);
    expect(viewport.y).toBe(-30);
    pz.destroy();
  });

  it("ignores wheel when isInteractive is false", () => {
    const { pz, el, onTransformChange } = createPanZoom();
    pz.setOptions({ isInteractive: false });
    el.dispatchEvent(
      new WheelEvent("wheel", { deltaY: -100, clientX: 400, clientY: 300, bubbles: true }),
    );
    vi.runAllTimers();
    expect(onTransformChange).not.toHaveBeenCalled();
    pz.destroy();
  });
});

// ─── Non-interactive guards ───────────────────────────────────
describe("PanZoom non-interactive guards", () => {
  it("mousedown ignored when not interactive", () => {
    const { pz, el, onTransformChange } = createPanZoom();
    pz.setOptions({ isInteractive: false });
    el.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 100, clientY: 100, button: 0, bubbles: true }),
    );
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 200, clientY: 200, bubbles: true }),
    );
    expect(onTransformChange).not.toHaveBeenCalled();
    pz.destroy();
  });

  it("dblclick ignored when not interactive", () => {
    const { pz, el, onTransformChange } = createPanZoom();
    pz.setOptions({ isInteractive: false });
    el.dispatchEvent(new MouseEvent("dblclick", { clientX: 400, clientY: 300, bubbles: true }));
    expect(onTransformChange).not.toHaveBeenCalled();
    pz.destroy();
  });
});

// ─── getBoundingClientRect ────────────────────────────────────
describe("PanZoom getBoundingClientRect", () => {
  it("returns element rect", () => {
    const { pz } = createPanZoom();
    const rect = pz.getBoundingClientRect();
    expect(rect).not.toBeNull();
    expect(rect!.width).toBe(800);
    expect(rect!.height).toBe(600);
    pz.destroy();
  });

  it("returns null when destroyed", () => {
    const { pz } = createPanZoom();
    pz.destroy();
    expect(pz.getBoundingClientRect()).toBeNull();
  });
});
