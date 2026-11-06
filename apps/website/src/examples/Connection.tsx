import { useState } from "react";
import {
  Background,
  Controls,
  DisplayZoom,
  NodeFlow,
  Toolbar,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@fedkit/react-node-flow";

const initialNodes: Node[] = [
  { id: "a", position: { x: 50, y: 100 }, data: { label: "Source A" } },
  { id: "b", position: { x: 300, y: 50 }, data: { label: "Target B" } },
  { id: "c", position: { x: 300, y: 200 }, data: { label: "Target C" } },
  { id: "d", position: { x: 50, y: 300 }, data: { label: "Source D" } },
];

export default function Connection() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onConnect = (connection: Connection) => {
    setEdges((prev) => [
      ...prev,
      {
        ...connection,
        id: `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}-${prev.length}`,
      },
    ]);
  };

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((prev) => {
      let next = prev;
      for (const change of changes) {
        if (change.type === "remove") {
          next = next.filter((n) => n.id !== change.id);
        } else if (change.type === "position") {
          next = next.map((n) =>
            n.id === change.id ? { ...n, position: change.position, dragging: change.dragging } : n,
          );
        } else if (change.type === "select") {
          next = next.map((n) => (n.id === change.id ? { ...n, selected: change.selected } : n));
        } else if (change.type === "add") {
          next = [...next, change.item];
        }
      }
      return next;
    });
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((prev) => {
      let next = prev;
      for (const change of changes) {
        if (change.type === "remove") {
          next = next.filter((e) => e.id !== change.id);
        } else if (change.type === "select") {
          next = next.map((e) => (e.id === change.id ? { ...e, selected: change.selected } : e));
        } else if (change.type === "add") {
          next = [...next, change.item];
        }
      }
      return next;
    });
  };

  return (
    <NodeFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
    >
      <Toolbar position="top-left">
        <div style={{ fontSize: 12, color: "#666", padding: "4px 8px" }}>
          Drag from a handle to create an edge. Select and press Delete to remove.
        </div>
        <DisplayZoom />
      </Toolbar>
      <Controls />
      <Background />
    </NodeFlow>
  );
}
