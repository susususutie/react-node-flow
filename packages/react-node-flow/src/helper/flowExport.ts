import type { Node, Edge } from "../types";

export type FlowExportData = {
  version: string;
  nodes: Node[];
  edges: Edge[];
};

/**
 * Export nodes and edges to a JSON string
 */
export function exportFlow(nodes: Node[], edges: Edge[]): string {
  const data: FlowExportData = {
    version: "1.0.0",
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Export nodes and edges to a JSON object
 */
export function exportFlowAsObject(nodes: Node[], edges: Edge[]): FlowExportData {
  return {
    version: "1.0.0",
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

/**
 * Import nodes and edges from a JSON string
 * Returns null if the JSON is invalid
 */
export function importFlow(json: string): {
  nodes: Node[];
  edges: Edge[];
} | null {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data !== "object") return null;
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;

    return {
      nodes: data.nodes,
      edges: data.edges,
    };
  } catch {
    return null;
  }
}

/**
 * Import nodes and edges from a JSON object
 * Returns null if the data is invalid
 */
export function importFlowFromObject(data: unknown): {
  nodes: Node[];
  edges: Edge[];
} | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) return null;

  // Validate each node/edge has an id
  const validNodes = obj.nodes.filter(
    (n: any) => n && typeof n === "object" && typeof n.id === "string",
  );
  const validEdges = obj.edges.filter(
    (e: any) => e && typeof e === "object" && typeof e.id === "string",
  );

  if (validNodes.length === 0 && validEdges.length === 0) return null;

  return {
    nodes: validNodes as Node[],
    edges: validEdges as Edge[],
  };
}
