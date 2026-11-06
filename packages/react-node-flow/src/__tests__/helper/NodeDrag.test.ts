import { describe, it, expect, vi } from "vite-plus/test";
import {
  createDragState,
  computeAutoPan,
  getDragChanges,
  getDragEndChanges,
  bindDocumentDragListeners,
  type DragItem,
} from "../../helper/NodeDrag";
import type { NodeChange } from "../../types";

function makeItem(overrides?: Partial<DragItem>): DragItem {
  return {
    id: "node-1",
    position: { x: 100, y: 200 },
    ...overrides,
  };
}

// ─── createDragState ──────────────────────────────────────────
describe("createDragState", () => {
  it("creates DragState with correct fields", () => {
    const items = [makeItem()];
    const state = createDragState(1, 10, 20, items);
    expect(state.pointerId).toBe(1);
    expect(state.startX).toBe(10);
    expect(state.startY).toBe(20);
    expect(state.items).toBe(items);
  });

  it("sets started to false initially", () => {
    expect(createDragState(1, 0, 0, []).started).toBe(false);
  });
});

// ─── computeAutoPan ───────────────────────────────────────────
describe("computeAutoPan", () => {
  const paneRect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;

  it("returns null when cursor is far from all edges", () => {
    expect(computeAutoPan(400, 300, paneRect)).toBeNull();
  });

  it("pans left when cursor is near left edge", () => {
    const result = computeAutoPan(10, 300, paneRect);
    expect(result).not.toBeNull();
    expect(result!.dx).toBeLessThan(0);
  });

  it("pans right when cursor is near right edge", () => {
    const result = computeAutoPan(790, 300, paneRect);
    expect(result).not.toBeNull();
    expect(result!.dx).toBeGreaterThan(0);
  });

  it("pans up when cursor is near top edge", () => {
    const result = computeAutoPan(400, 10, paneRect);
    expect(result).not.toBeNull();
    expect(result!.dy).toBeLessThan(0);
  });

  it("pans down when cursor is near bottom edge", () => {
    const result = computeAutoPan(400, 590, paneRect);
    expect(result).not.toBeNull();
    expect(result!.dy).toBeGreaterThan(0);
  });

  it("pans diagonally when near top-left corner", () => {
    const result = computeAutoPan(10, 10, paneRect);
    expect(result).not.toBeNull();
    expect(result!.dx).toBeLessThan(0);
    expect(result!.dy).toBeLessThan(0);
  });

  it("scales pan speed proportionally to distance from edge", () => {
    const near = computeAutoPan(5, 300, paneRect)!;
    const far = computeAutoPan(35, 300, paneRect)!;
    expect(Math.abs(near.dx)).toBeGreaterThan(Math.abs(far.dx));
  });
});

// ─── getDragChanges ───────────────────────────────────────────
describe("getDragChanges", () => {
  it("computes correct position delta accounting for zoom", () => {
    const drag = createDragState(1, 100, 100, [makeItem()]);
    const changes = getDragChanges(drag, 150, 150, 2, false);
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).position).toEqual({
      x: 125,
      y: 225,
    }); // 100 + (50/2)
  });

  it("returns one change per drag item", () => {
    const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
    const drag = createDragState(1, 0, 0, items);
    const changes = getDragChanges(drag, 10, 10, 1, false);
    expect(changes).toHaveLength(2);
  });

  it("sets dragging flag from parameter", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    expect(
      (getDragChanges(drag, 10, 10, 1, true)[0] as Extract<NodeChange, { type: "position" }>)
        .dragging,
    ).toBe(true);
    expect(
      (getDragChanges(drag, 10, 10, 1, false)[0] as Extract<NodeChange, { type: "position" }>)
        .dragging,
    ).toBe(false);
  });

  it("snaps to grid when snapToGridEnabled", () => {
    const drag = createDragState(1, 0, 0, [makeItem({ position: { x: 0, y: 0 } })]);
    const changes = getDragChanges(drag, 17, 23, 1, false, true, [15, 15]);
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).position).toEqual({
      x: 15,
      y: 30,
    });
  });

  it("does not snap when snapToGridEnabled is false", () => {
    const drag = createDragState(1, 0, 0, [makeItem({ position: { x: 0, y: 0 } })]);
    const changes = getDragChanges(drag, 17, 23, 1, false, false, [15, 15]);
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).position).toEqual({
      x: 17,
      y: 23,
    });
  });

  it("clamps position when node has extent: 'parent'", () => {
    const drag = createDragState(1, 0, 0, [
      makeItem({
        position: { x: 0, y: 0 },
        extent: "parent",
        width: 100,
        height: 50,
        parentWidth: 200,
        parentHeight: 100,
      }),
    ]);
    const changes = getDragChanges(drag, 500, 500, 1, false);
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).position.x).toBe(100); // 200 - 100
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).position.y).toBe(50); // 100 - 50
  });

  it("clamps position with explicit extent object", () => {
    const drag = createDragState(1, 0, 0, [
      makeItem({
        position: { x: 0, y: 0 },
        extent: { left: 10, top: 10, right: 200, bottom: 200 },
        width: 50,
        height: 50,
      }),
    ]);
    const changes = getDragChanges(drag, 500, 500, 1, false);
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).position.x).toBe(150); // 200 - 50
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).position.y).toBe(150);
  });

  it("averages position when node is larger than parent", () => {
    // Use explicit extent where minX > maxX to trigger the fallback
    const drag = createDragState(1, 0, 0, [
      makeItem({
        position: { x: 0, y: 0 },
        extent: { left: 100, top: 0, right: 50, bottom: 100 },
        width: 80,
        height: 50,
      }),
    ]);
    const changes = getDragChanges(drag, 0, 0, 1, false);
    // minX=100, maxX=50-80=-30, minX > maxX so clampedX = (100 + -30)/2 = 35
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).position.x).toBe(35);
  });
});

// ─── getDragEndChanges ────────────────────────────────────────
describe("getDragEndChanges", () => {
  it("returns changes with dragging: false", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    const changes = getDragEndChanges(drag, 10, 10, 1);
    expect((changes[0] as Extract<NodeChange, { type: "position" }>).dragging).toBe(false);
  });
});

// ─── bindDocumentDragListeners ────────────────────────────────
describe("bindDocumentDragListeners", () => {
  it("ignores pointer events with wrong pointerId", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    const onChange = vi.fn();
    const cleanup = bindDocumentDragListeners(drag, { onChange, onEnd: vi.fn(), getZoom: () => 1 });

    const event = new PointerEvent("pointermove", {
      pointerId: 99,
      clientX: 50,
      clientY: 50,
      bubbles: true,
    });
    document.dispatchEvent(event);
    expect(onChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("does not start drag until threshold exceeded", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    const onStart = vi.fn();
    const onChange = vi.fn();
    const cleanup = bindDocumentDragListeners(drag, {
      onChange,
      onEnd: vi.fn(),
      onStart,
      getZoom: () => 1,
    });

    const event = new PointerEvent("pointermove", {
      pointerId: 1,
      clientX: 2,
      clientY: 0,
      bubbles: true,
    });
    document.dispatchEvent(event);
    expect(onStart).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("calls onStart once threshold is crossed", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    const onStart = vi.fn();
    const cleanup = bindDocumentDragListeners(drag, {
      onChange: vi.fn(),
      onEnd: vi.fn(),
      onStart,
      getZoom: () => 1,
    });

    const event = new PointerEvent("pointermove", {
      pointerId: 1,
      clientX: 10,
      clientY: 0,
      bubbles: true,
    });
    document.dispatchEvent(event);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(drag.started).toBe(true);

    cleanup();
  });

  it("calls onChange with drag changes during move", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    const onChange = vi.fn();
    const cleanup = bindDocumentDragListeners(drag, { onChange, onEnd: vi.fn(), getZoom: () => 1 });

    // First move past threshold
    document.dispatchEvent(
      new PointerEvent("pointermove", { pointerId: 1, clientX: 10, clientY: 0, bubbles: true }),
    );
    // Second move
    document.dispatchEvent(
      new PointerEvent("pointermove", { pointerId: 1, clientX: 20, clientY: 10, bubbles: true }),
    );
    expect(onChange).toHaveBeenCalledTimes(2);

    cleanup();
  });

  it("calls onEnd on pointerup", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    drag.started = true;
    const onEnd = vi.fn();
    const cleanup = bindDocumentDragListeners(drag, { onChange: vi.fn(), onEnd, getZoom: () => 1 });

    document.dispatchEvent(
      new PointerEvent("pointerup", { pointerId: 1, clientX: 30, clientY: 20, bubbles: true }),
    );
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0][0][0].dragging).toBe(false);

    cleanup();
  });

  it("removes event listeners on cleanup", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    const onChange = vi.fn();
    const cleanup = bindDocumentDragListeners(drag, { onChange, onEnd: vi.fn(), getZoom: () => 1 });

    cleanup();

    document.dispatchEvent(
      new PointerEvent("pointermove", { pointerId: 1, clientX: 50, clientY: 50, bubbles: true }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not call onEnd if drag never started", () => {
    const drag = createDragState(1, 0, 0, [makeItem()]);
    const onEnd = vi.fn();
    const cleanup = bindDocumentDragListeners(drag, { onChange: vi.fn(), onEnd, getZoom: () => 1 });

    // Move less than threshold, then pointerup
    document.dispatchEvent(
      new PointerEvent("pointermove", { pointerId: 1, clientX: 1, clientY: 0, bubbles: true }),
    );
    document.dispatchEvent(
      new PointerEvent("pointerup", { pointerId: 1, clientX: 1, clientY: 0, bubbles: true }),
    );
    expect(onEnd).not.toHaveBeenCalled();

    cleanup();
  });
});
