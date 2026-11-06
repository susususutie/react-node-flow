import useData from "../hooks/useData";
import EdgeWrapper from "../components/EdgeWrapper";

export default function EdgeRenderer() {
  const { edges } = useData();

  return (
    <div
      className="node-flow__edges"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {edges.map((edge) => {
        if (!edge.id) return null;
        return <EdgeWrapper key={edge.id} id={edge.id} />;
      })}
    </div>
  );
}
