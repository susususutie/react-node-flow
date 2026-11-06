import useReactive from "../hooks/useReactive";
import useData from "../hooks/useData";
import { getIsNodesInitialized } from "../helper/utils";

export default function DisplayZoom() {
  const reactive = useReactive();
  const data = useData();
  const nodesInitialized = getIsNodesInitialized(data.nodes, data.nodeLookup);

  return (
    <div>
      Zoom: {reactive.transform[2] ?? "none"} {nodesInitialized ? " (initialized)" : ""}
    </div>
  );
}
