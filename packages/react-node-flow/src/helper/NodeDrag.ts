import { type XYPosition, type NodeChange } from "../types";

export type DragItem = {
  id: string;
  position: XYPosition;
  /** Parent node's position (if any) */
  parentPosition?: XYPosition;
  /** Extent constraint */
  extent?: "parent" | { left: number; top: number; right: number; bottom: number };
  /** Node dimensions for extent calculation */
  width?: number;
  height?: number;
  /** Parent node dimensions for extent calculation */
  parentWidth?: number;
  parentHeight?: number;
};

export type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  items: DragItem[];
  started: boolean;
};

const DRAG_THRESHOLD = 3;
const AUTO_PAN_BORDER = 40;
const AUTO_PAN_SPEED = 10;

export type NodeDragCallbacks = {
  onChange: (changes: NodeChange[]) => void;
  onEnd: (changes: NodeChange[]) => void;
  onStart?: () => void;
  getZoom: () => number;
  panBy?: (dx: number, dy: number) => void;
  getPaneRect?: () => DOMRect | null;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
};

export function createDragState(
  pointerId: number,
  startX: number,
  startY: number,
  items: DragItem[],
): DragState {
  return { pointerId, startX, startY, items, started: false };
}

export function computeAutoPan(
  clientX: number,
  clientY: number,
  paneRect: DOMRect,
): { dx: number; dy: number } | null {
  const left = clientX - paneRect.left;
  const top = clientY - paneRect.top;
  const right = paneRect.width - left;
  const bottom = paneRect.height - top;

  let dx = 0;
  let dy = 0;

  if (left >= 0 && left < AUTO_PAN_BORDER) {
    dx = -AUTO_PAN_SPEED * ((AUTO_PAN_BORDER - left) / AUTO_PAN_BORDER);
  } else if (right >= 0 && right < AUTO_PAN_BORDER) {
    dx = AUTO_PAN_SPEED * ((AUTO_PAN_BORDER - right) / AUTO_PAN_BORDER);
  }

  if (top >= 0 && top < AUTO_PAN_BORDER) {
    dy = -AUTO_PAN_SPEED * ((AUTO_PAN_BORDER - top) / AUTO_PAN_BORDER);
  } else if (bottom >= 0 && bottom < AUTO_PAN_BORDER) {
    dy = AUTO_PAN_SPEED * ((AUTO_PAN_BORDER - bottom) / AUTO_PAN_BORDER);
  }

  if (dx === 0 && dy === 0) return null;
  return { dx, dy };
}

function clampPosition(position: XYPosition, item: DragItem): XYPosition {
  if (!item.extent || !item.width || !item.height) return position;

  let minX = -Infinity;
  let minY = -Infinity;
  let maxX = Infinity;
  let maxY = Infinity;

  if (item.extent === "parent") {
    // Constrain to parent bounds
    const pw = item.parentWidth ?? 0;
    const ph = item.parentHeight ?? 0;
    minX = 0;
    minY = 0;
    maxX = Math.max(0, pw - item.width);
    maxY = Math.max(0, ph - item.height);
  } else {
    // Explicit extent bounds
    minX = item.extent.left;
    minY = item.extent.top;
    maxX = item.extent.right - item.width;
    maxY = item.extent.bottom - item.height;
  }

  // Ensure minX <= maxX and minY <= maxY (handles case where node is larger than parent)
  const clampedX = minX > maxX ? (minX + maxX) / 2 : Math.min(Math.max(position.x, minX), maxX);
  const clampedY = minY > maxY ? (minY + maxY) / 2 : Math.min(Math.max(position.y, minY), maxY);

  return { x: clampedX, y: clampedY };
}

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function getDragChanges(
  drag: DragState,
  clientX: number,
  clientY: number,
  zoom: number,
  dragging: boolean,
  snapToGridEnabled?: boolean,
  snapGridSize?: [number, number],
): NodeChange[] {
  const dx = (clientX - drag.startX) / zoom;
  const dy = (clientY - drag.startY) / zoom;
  return drag.items.map((item) => {
    let rawX = item.position.x + dx;
    let rawY = item.position.y + dy;

    if (snapToGridEnabled && snapGridSize) {
      rawX = snapToGrid(rawX, snapGridSize[0]);
      rawY = snapToGrid(rawY, snapGridSize[1]);
    }

    const rawPosition = { x: rawX, y: rawY };
    const position = clampPosition(rawPosition, item);
    return {
      id: item.id,
      type: "position" as const,
      position,
      dragging,
    };
  });
}

export function getDragEndChanges(
  drag: DragState,
  clientX: number,
  clientY: number,
  zoom: number,
  snapToGridEnabled?: boolean,
  snapGridSize?: [number, number],
): NodeChange[] {
  return getDragChanges(drag, clientX, clientY, zoom, false, snapToGridEnabled, snapGridSize);
}

function getDragDistance(drag: DragState, clientX: number, clientY: number): number {
  return Math.hypot(clientX - drag.startX, clientY - drag.startY);
}

function handleAutoPan(clientX: number, clientY: number, callbacks: NodeDragCallbacks) {
  const getPaneRect = callbacks.getPaneRect;
  const panBy = callbacks.panBy;
  if (!getPaneRect || !panBy) return;

  const paneRect = getPaneRect();
  if (!paneRect) return;

  const pan = computeAutoPan(clientX, clientY, paneRect);
  if (pan) {
    panBy(pan.dx, pan.dy);
  }
}

export function bindDocumentDragListeners(
  drag: DragState,
  callbacks: NodeDragCallbacks,
): () => void {
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== drag.pointerId) return;

    event.preventDefault();

    if (!drag.started) {
      const distance = getDragDistance(drag, event.clientX, event.clientY);
      if (distance < DRAG_THRESHOLD) return;

      drag.started = true;
      callbacks.onStart?.();
    }

    const zoom = callbacks.getZoom();
    const changes = getDragChanges(
      drag,
      event.clientX,
      event.clientY,
      zoom,
      true,
      callbacks.snapToGrid,
      callbacks.snapGrid,
    );
    callbacks.onChange(changes);

    handleAutoPan(event.clientX, event.clientY, callbacks);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== drag.pointerId) return;

    if (drag.started) {
      const zoom = callbacks.getZoom();
      const changes = getDragEndChanges(
        drag,
        event.clientX,
        event.clientY,
        zoom,
        callbacks.snapToGrid,
        callbacks.snapGrid,
      );
      callbacks.onEnd(changes);
    }

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  document.addEventListener("pointermove", onPointerMove, { passive: false });
  document.addEventListener("pointerup", onPointerUp);

  return () => {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };
}
