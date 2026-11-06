import { DisplayZoom, NodeFlow, Toolbar } from "@fedkit/react-node-flow";

export default function DefaultEdges() {
  return (
    <NodeFlow
      defaultNodes={[
        { id: "a", position: { x: 150, y: 100 - 60 }, data: { label: "A" } },
        { id: "b", position: { x: 300, y: 150 - 60 }, data: { label: "B" } },
        { id: "c", position: { x: 250, y: 300 - 60 }, data: { label: "C" } },
        { id: "d", position: { x: 50, y: 250 - 60 }, data: { label: "D" } },
      ]}
      defaultEdges={[
        { id: "ab", source: "a", target: "b" },
        { id: "bc", source: "b", target: "c", type: "straight" },
        { id: "cd", source: "c", target: "d", type: "step" },
        { id: "da", source: "d", target: "a", type: "smoothstep" },
      ]}
      onNodesChange={(nodes) => console.log(nodes)}
    >
      <Toolbar>
        <DisplayZoom />
      </Toolbar>
    </NodeFlow>
  );
}
