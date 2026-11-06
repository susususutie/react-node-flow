import { useState } from "react";
import {
  Background,
  Controls,
  DisplayZoom,
  MiniMap,
  NodeFlow,
  Toolbar,
  ZoomController,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@fedkit/react-node-flow";

type CustomInputNode = Node<{ label?: string; count?: number }, "customInput">;
function CustomInputNode(props: NodeProps<CustomInputNode>) {
  const [count, setCount] = useState(props.data?.count ?? 0);
  return (
    <>
      <div style={{ opacity: 0.7, fontSize: 11, marginBottom: 4 }}>CustomInputNode</div>
      <div style={{ fontWeight: 600 }}>
        {typeof props.data?.label === "string" ? props.data.label : props.id}
        <button
          className="nodrag"
          onClick={(e) => {
            console.log(e);
            setCount(Math.round(Math.random() * 100));
          }}
        >
          changeCount {count}
        </button>
      </div>
      {props.dragging && <div style={{ fontSize: 11, opacity: 0.6 }}>dragging...</div>}
    </>
  );
}

const nodeTypes = {
  customInput: CustomInputNode,
} as NodeTypes;

export default function CustomNode() {
  return (
    <NodeFlow
      nodeTypes={nodeTypes}
      defaultNodes={[
        {
          id: "1",
          type: "customInput",
          position: { x: 60, y: 80 },
          data: { label: "custom", count: 1 },
        },
        { id: "2", position: { x: 300, y: 160 }, data: { label: "Transform" } },
        { id: "3", type: "output", position: { x: 560, y: 80 }, data: { label: "Result" } },
      ]}
      defaultEdges={[
        { id: "e1-2", source: "1", target: "2", animated: true },
        { id: "e2-3", source: "2", target: "3" },
      ]}
    >
      <Toolbar>
        <DisplayZoom />
        <ZoomController />
      </Toolbar>
      <Background id="1" variant="lines" gap={10} color="#f4f4f480" />
      <Background id="3" variant="lines" gap={100} />
      <Controls />
      <MiniMap position="top-right" />
    </NodeFlow>
  );
}
