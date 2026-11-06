import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "../types";

type HistoryEntry = {
  nodes: Node[];
  edges: Edge[];
};

type UseUndoRedoOptions = {
  /** Maximum history size. Default: 50 */
  maxHistory?: number;
};

type UseUndoRedoReturn = {
  /** Undo the last change */
  undo: () => void;
  /** Redo the last undone change */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Take a snapshot of the current state */
  takeSnapshot: (nodes: Node[], edges: Edge[]) => void;
  /** Get the current history stack (for debugging) */
  getHistory: () => HistoryEntry[];
};

export default function useUndoRedo(options?: UseUndoRedoOptions): UseUndoRedoReturn {
  const maxHistory = options?.maxHistory ?? 50;
  const historyRef = useRef<HistoryEntry[]>([]);
  const pointerRef = useRef(-1);

  const [, forceUpdate] = useState(0);

  const takeSnapshot = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      const snapshot: HistoryEntry = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      };

      // Remove any redo history beyond the current pointer
      const newHistory = historyRef.current.slice(0, pointerRef.current + 1);
      newHistory.push(snapshot);

      // Trim to max size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      } else {
        pointerRef.current++;
      }

      historyRef.current = newHistory;
      forceUpdate((c) => c + 1);
    },
    [maxHistory],
  );

  const undo = useCallback(() => {
    if (pointerRef.current <= 0) return;
    pointerRef.current--;
    forceUpdate((c) => c + 1);
  }, []);

  const redo = useCallback(() => {
    if (pointerRef.current >= historyRef.current.length - 1) return;
    pointerRef.current++;
    forceUpdate((c) => c + 1);
  }, []);

  const getHistory = useCallback(() => historyRef.current, []);

  return {
    undo,
    redo,
    canUndo: pointerRef.current > 0,
    canRedo: pointerRef.current < historyRef.current.length - 1,
    takeSnapshot,
    getHistory,
  };
}

type UseUndoRedoFlowReturn = {
  /** Undo the last change - restores state to the store */
  undo: () => void;
  /** Redo the last undone change - restores state to the store */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Take a snapshot of the current state */
  takeSnapshot: (nodes: Node[], edges: Edge[]) => void;
};

/**
 * Hook that provides undo/redo functionality integrated with the flow store.
 * Accepts a restore callback that is called when undo/redo changes state.
 *
 * @param restore - Called with { nodes, edges } when undo/redo fires
 * @param options - Optional maxHistory config
 */
export function useUndoRedoFlow(
  restore: (payload: { nodes: Node[]; edges: Edge[] }) => void,
  options?: UseUndoRedoOptions,
): UseUndoRedoFlowReturn {
  const maxHistory = options?.maxHistory ?? 50;
  const historyRef = useRef<HistoryEntry[]>([]);
  const pointerRef = useRef(-1);

  const takeSnapshot = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      const snapshot: HistoryEntry = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      };

      // Remove any redo history beyond the current pointer
      const newHistory = historyRef.current.slice(0, pointerRef.current + 1);
      newHistory.push(snapshot);

      // Trim to max size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      } else {
        pointerRef.current++;
      }

      historyRef.current = newHistory;
    },
    [maxHistory],
  );

  const undo = useCallback(() => {
    if (pointerRef.current <= 0) return;
    pointerRef.current--;
    const entry = historyRef.current[pointerRef.current];
    if (entry) {
      restore({ nodes: entry.nodes, edges: entry.edges });
    }
  }, [restore]);

  const redo = useCallback(() => {
    if (pointerRef.current >= historyRef.current.length - 1) return;
    pointerRef.current++;
    const entry = historyRef.current[pointerRef.current];
    if (entry) {
      restore({ nodes: entry.nodes, edges: entry.edges });
    }
  }, [restore]);

  return {
    undo,
    redo,
    canUndo: pointerRef.current > 0,
    canRedo: pointerRef.current < historyRef.current.length - 1,
    takeSnapshot,
  };
}
