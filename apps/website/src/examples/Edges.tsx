import { Background, NodeFlow } from "@fedkit/react-node-flow";

const X = 300;
const Y = 200;
const G = 160;
const edgeTypes = ["bezier", "straight", "step", "smoothstep", "simplebezier"];

export default function Edges() {
  return (
    <>
      {edgeTypes.map((edgeType) => (
        <div key={edgeType} style={{ marginInline: 60, marginBlock: 24 }}>
          <p>{edgeType}</p>
          <div style={{ height: 400, border: "1px solid" }}>
            <NodeFlow
              defaultNodes={[
                { id: "center", position: { x: X, y: Y }, data: { label: "Center" } },
                { id: "top", position: { x: X, y: Y - G }, data: { label: "Top" } },
                { id: "top-right", position: { x: X + G, y: Y - G }, data: { label: "Top Right" } },
                { id: "right", position: { x: X + G, y: Y }, data: { label: "Right" } },
                {
                  id: "bottom-right",
                  position: { x: X + G, y: Y + G },
                  data: { label: "Bottom Right" },
                },
                { id: "bottom", position: { x: X, y: Y + G }, data: { label: "Bottom" } },
                {
                  id: "bottom-left",
                  position: { x: X - G, y: Y + G },
                  data: { label: "Bottom Left" },
                },
                { id: "left", position: { x: X - G, y: Y }, data: { label: "Left" } },
                { id: "top-left", position: { x: X - G, y: Y - G }, data: { label: "Top Left" } },
              ]}
              defaultEdges={[
                { id: "top", source: "center", target: "top", type: edgeType },
                { id: "top-right", source: "center", target: "top-right", type: edgeType },
                { id: "right", source: "center", target: "right", type: edgeType },
                { id: "bottom-right", source: "center", target: "bottom-right", type: edgeType },
                { id: "bottom", source: "center", target: "bottom", type: edgeType },
                { id: "bottom-left", source: "center", target: "bottom-left", type: edgeType },
                { id: "left", source: "center", target: "left", type: edgeType },
                { id: "top-left", source: "center", target: "top-left", type: edgeType },
              ]}
            >
              <Background />
            </NodeFlow>
          </div>
        </div>
      ))}
    </>
  );
}
