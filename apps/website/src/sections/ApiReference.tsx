import PropsTable from "../components/PropsTable";
import { edgeFields, nodeFields, nodeFlowPropGroups, sharedTypes } from "../docs/props";

export default function ApiReference() {
  return (
    <section id="api">
      <h2>NodeFlow 参数</h2>

      {nodeFlowPropGroups.map((group) => (
        <div key={group.title} className="prop-group">
          <h3>{group.title}</h3>
          <PropsTable props={group.props} />
        </div>
      ))}

      <h2 id="types">数据结构</h2>
      <p>
        节点与边都是普通对象，业务数据放在 <code>data</code> 中，其余字段控制渲染和交互。
      </p>

      <h3>Node</h3>
      <PropsTable props={nodeFields} />

      <h3>Edge</h3>
      <PropsTable props={edgeFields} />

      <h3>共享类型</h3>
      <PropsTable props={sharedTypes} />
    </section>
  );
}
