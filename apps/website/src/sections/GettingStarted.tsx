import CodeBlock from "../components/CodeBlock";

const installCode = "pnpm add @fedkit/react-node-flow";

const basicCode = `import { Background, Controls, NodeFlow } from "@fedkit/react-node-flow";
import "@fedkit/react-node-flow/style.css";

const nodes = [
  { id: "a", position: { x: 40, y: 40 }, data: { label: "A" } },
  { id: "b", position: { x: 300, y: 160 }, data: { label: "B" } },
];

const edges = [{ id: "a-b", source: "a", target: "b" }];

export default function App() {
  return (
    <div style={{ width: "100%", height: 480 }}>
      <NodeFlow defaultNodes={nodes} defaultEdges={edges}>
        <Background />
        <Controls />
      </NodeFlow>
    </div>
  );
}`;

const controlledCode = `import { useState } from "react";
import { NodeFlow, type Node, type NodeChange } from "@fedkit/react-node-flow";

const initialNodes: Node[] = [
  { id: "a", position: { x: 40, y: 40 }, data: { label: "A" } },
];

function applyChanges(nodes: Node[], changes: NodeChange[]) {
  return nodes
    .map((node) => {
      const change = changes.find((item) => "id" in item && item.id === node.id);
      if (change?.type === "position") return { ...node, position: change.position };
      if (change?.type === "select") return { ...node, selected: change.selected };
      return node;
    })
    .filter(
      (node) =>
        !changes.some((item) => "id" in item && item.id === node.id && item.type === "remove"),
    );
}

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);

  return (
    <NodeFlow
      nodes={nodes}
      onNodesChange={(changes) => setNodes((current) => applyChanges(current, changes))}
    />
  );
}`;

export default function GettingStarted() {
  return (
    <section id="getting-started">
      <h2>快速开始</h2>
      <p>
        从零实现的 React 节点流编辑器，不依赖 reactflow。内置平移缩放、节点拖拽、连接线、边渲染、
        缩略图、背景和一组画布控件，并提供受控与非受控两种数据模式。
      </p>

      <h3>安装</h3>
      <CodeBlock code={installCode} />
      <p className="muted">
        组件库把样式拆成了独立文件；使用发布包时需要显式引入
        <code>@fedkit/react-node-flow/style.css</code>。
      </p>

      <h3>渲染一张图</h3>
      <CodeBlock code={basicCode} />
      <p className="muted">
        NodeFlow 默认宽高为 100%，外层容器需要有确定的高度，否则画布会被压成 0。
      </p>

      <h3>受控模式</h3>
      <p>
        传入 <code>nodes</code> / <code>edges</code> 后即进入受控模式，库不再直接修改数据，
        每次变化都会通过 <code>onNodesChange</code> / <code>onEdgesChange</code> 交给你处理。
      </p>
      <CodeBlock code={controlledCode} />

      <div className="callout">
        <strong>约定</strong>
        <ul>
          <li>
            <code>nodeTypes</code> 与 <code>edgeTypes</code> 必须在组件外或 <code>useMemo</code>{" "}
            中定义，避免每次渲染重建映射表。
          </li>
          <li>连接结果不会自动写入 edges，需要在 onConnect 中自行添加。</li>
          <li>
            节点内部需要滚动的区域加上 <code>data-flow-no-wheel</code>，可跳过画布的滚轮处理。
          </li>
        </ul>
      </div>
    </section>
  );
}
