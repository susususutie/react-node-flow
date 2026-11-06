import { type NodeProps, Position, HandleTypeEnum } from "../../types";
import Handle from "../Handle";

export default function OutputNode(props: NodeProps) {
  const data = props.data;
  const raw =
    data && typeof data === "object" && "label" in data
      ? (data as Record<string, unknown>).label
      : undefined;
  const label = typeof raw === "string" ? raw : "";

  return (
    <>
      {label || props.id}
      <Handle
        id="target"
        nodeId={props.id}
        type={HandleTypeEnum.Target}
        position={Position.Right}
      />
    </>
  );
}
