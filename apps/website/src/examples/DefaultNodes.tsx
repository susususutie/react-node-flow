import { Background, NodeFlow } from "@fedkit/react-node-flow";

export default function DefaultNodes() {
  return (
    <NodeFlow
      defaultNodes={[
        { id: "a", position: { x: 0, y: 0 }, data: { label: "A" } },
        { id: "b", position: { x: 100, y: 0 }, data: { label: "B" } },
        { id: "c", position: { x: 100, y: 100 }, data: { label: "C" } },
        { id: "d", position: { x: 0, y: 100 }, data: { label: "D" } },
      ]}
    >
      <Background />
    </NodeFlow>
  );
}
