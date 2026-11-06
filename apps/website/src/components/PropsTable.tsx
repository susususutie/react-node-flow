import type { PropDoc } from "../docs/props";

export default function PropsTable({ props }: { props: PropDoc[] }) {
  if (props.length === 0) return <p className="muted">该组件没有 props。</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>属性</th>
            <th>类型</th>
            <th>默认值</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name}>
              <td>
                <code>{prop.name}</code>
              </td>
              <td>
                <code className="type">{prop.type}</code>
              </td>
              <td>
                {prop.defaultValue ? (
                  <code>{prop.defaultValue}</code>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
