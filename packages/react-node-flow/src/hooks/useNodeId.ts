import { useContext } from "react";
import NodeIdContext from "../contexts/NodeIdContext";

export default function useNodeId() {
  return useContext(NodeIdContext);
}
