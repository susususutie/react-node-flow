import { useContext } from "react";
import EdgeIdContext from "../contexts/EdgeIdContext";

export default function useEdgeId() {
  return useContext(EdgeIdContext);
}
