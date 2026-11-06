import { Background, DisplayZoom, NodeFlow, Toolbar } from "@fedkit/react-node-flow";

export default function Markers() {
  return (
    <NodeFlow
      defaultNodes={[
        { id: "a", position: { x: 40, y: 80 }, data: { label: "arrowclosed" } },
        { id: "b", position: { x: 40, y: 180 }, data: { label: "arrow" } },
        { id: "c", position: { x: 40, y: 280 }, data: { label: "circle" } },
        { id: "d", position: { x: 40, y: 380 }, data: { label: "diamond" } },
        { id: "e", position: { x: 40, y: 480 }, data: { label: "no marker" } },
        { id: "ax", position: { x: 260, y: 80 }, data: { label: "target" } },
        { id: "bx", position: { x: 260, y: 180 }, data: { label: "target" } },
        { id: "cx", position: { x: 260, y: 280 }, data: { label: "target" } },
        { id: "dx", position: { x: 260, y: 380 }, data: { label: "target" } },
        { id: "ex", position: { x: 260, y: 480 }, data: { label: "target" } },
      ]}
      defaultEdges={[
        {
          id: "ea",
          source: "a",
          target: "ax",
          type: "straight",
          markerEnd: { type: "arrowclosed" },
        },
        { id: "eb", source: "b", target: "bx", type: "straight", markerEnd: { type: "arrow" } },
        { id: "ec", source: "c", target: "cx", type: "straight", markerEnd: { type: "circle" } },
        { id: "ed", source: "d", target: "dx", type: "straight", markerEnd: { type: "diamond" } },
        { id: "ee", source: "e", target: "ex", type: "straight", markerEnd: undefined },
      ]}
    >
      <Toolbar>
        <DisplayZoom />
      </Toolbar>
      <Background variant="dots" gap={20} />
    </NodeFlow>
  );
}
