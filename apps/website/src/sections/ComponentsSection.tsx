import PropsTable from "../components/PropsTable";
import { componentDocs, utilityDocs } from "../docs/components";

export default function ComponentsSection() {
  return (
    <section id="components">
      <h2>内置组件</h2>
      <p>附加组件作为 NodeFlow 的 children 渲染，位置和样式都可以按需覆盖。</p>

      {componentDocs.map((component) => (
        <article key={component.name} className="component-card">
          <header>
            <h3>
              <code>{component.name}</code>
            </h3>
            <p>{component.summary}</p>
          </header>
          <PropsTable props={component.props} />
        </article>
      ))}

      <h2 id="utilities">工具函数与 Hooks</h2>
      <p>用于导入导出流程数据，以及接入撤销/重做。</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>导出</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {utilityDocs.map((item) => (
              <tr key={item.name}>
                <td>
                  <code>{item.name}</code>
                </td>
                <td>
                  <code className="type">{item.type}</code>
                </td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
