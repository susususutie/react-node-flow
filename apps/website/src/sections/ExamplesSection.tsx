import { useState } from "react";
import CodeBlock from "../components/CodeBlock";
import Basic from "../examples/Basic";
import Connection from "../examples/Connection";
import CustomNode from "../examples/CustomNode";
import DefaultEdges from "../examples/DefaultEdges";
import DefaultNodes from "../examples/DefaultNodes";
import Edges from "../examples/Edges";
import Markers from "../examples/Markers";
import basicCode from "../examples/Basic.tsx?raw";
import connectionCode from "../examples/Connection.tsx?raw";
import customNodeCode from "../examples/CustomNode.tsx?raw";
import defaultEdgesCode from "../examples/DefaultEdges.tsx?raw";
import defaultNodesCode from "../examples/DefaultNodes.tsx?raw";
import edgesCode from "../examples/Edges.tsx?raw";
import markersCode from "../examples/Markers.tsx?raw";

const examples = [
  { id: "basic", label: "基础", Component: Basic, code: basicCode },
  { id: "default-nodes", label: "默认节点", Component: DefaultNodes, code: defaultNodesCode },
  { id: "default-edges", label: "默认边", Component: DefaultEdges, code: defaultEdgesCode },
  { id: "edges", label: "边类型", Component: Edges, code: edgesCode },
  { id: "custom-node", label: "自定义节点", Component: CustomNode, code: customNodeCode },
  { id: "connection", label: "连线", Component: Connection, code: connectionCode },
  { id: "markers", label: "端点标记", Component: Markers, code: markersCode },
];

export default function ExamplesSection() {
  const [selectedId, setSelectedId] = useState(examples[0].id);
  const [showCode, setShowCode] = useState(false);
  const selected = examples.find((example) => example.id === selectedId) ?? examples[0];
  const Preview = selected.Component;

  return (
    <section id="examples">
      <h2>示例</h2>
      <p>所有示例都直接使用发布包导出的 API，切换标签查看不同能力的组合方式。</p>

      <div className="example-tabs" role="tablist" aria-label="示例">
        {examples.map((example) => (
          <button
            key={example.id}
            type="button"
            role="tab"
            aria-selected={example.id === selected.id}
            className={example.id === selected.id ? "tab active" : "tab"}
            onClick={() => setSelectedId(example.id)}
          >
            {example.label}
          </button>
        ))}
      </div>

      <div className="example-stage">
        <Preview />
      </div>

      <div className="example-actions">
        <button type="button" className="ghost" onClick={() => setShowCode((value) => !value)}>
          {showCode ? "隐藏代码" : "查看代码"}
        </button>
        <span className="muted">拖动画布、滚轮缩放、拖动节点都可以直接试。</span>
      </div>

      {showCode ? <CodeBlock code={selected.code} label="示例代码" /> : null}
    </section>
  );
}
