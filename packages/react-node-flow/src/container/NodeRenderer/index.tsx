import useData from "../../hooks/useData";
import NodeWrapper from "../../components/NodeWrapper";
import { useState, type CSSProperties, useEffect } from "react";
import useDispatch from "../../hooks/useDispatch";

const nodeRendererStyle: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
};

type NodeRendererProps = {
  nfId: string;
};

export default function NodeRenderer(props: NodeRendererProps) {
  const { nfId } = props;
  const { nodes, nodesConnectable, nodesDraggable, nodesSelectable } = useData();
  const dispatch = useDispatch();

  // TODO：
  // 1. 只渲染 !hide 的节点
  // 2. 所有节点共用一个 ResizeObserver 实例，监听节点尺寸变更，更新节点测量数据
  const [resizeObserver] = useState(() => {
    if (typeof ResizeObserver === "undefined") {
      return null;
    }

    return new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const updateNodes = new Map<string, { nodeElement: HTMLDivElement }>();
      entries.forEach((entry: ResizeObserverEntry) => {
        const id = entry.target.getAttribute("data-id") as string;
        updateNodes.set(id, {
          nodeElement: entry.target as HTMLDivElement,
        });
      });

      dispatch({ type: "updateNodeInternals", payload: updateNodes });
    });
  });

  useEffect(() => {
    return () => {
      resizeObserver?.disconnect();
    };
  }, [resizeObserver]);

  return (
    <div className="node-flow__nodes" style={nodeRendererStyle}>
      {nodes.map((node) => (
        <NodeWrapper
          key={node.id}
          nfId={nfId}
          id={node.id}
          nodesDraggable={nodesDraggable}
          nodesSelectable={nodesSelectable}
          nodesConnectable={nodesConnectable}
          resizeObserver={resizeObserver}
        />
      ))}
    </div>
  );
}
