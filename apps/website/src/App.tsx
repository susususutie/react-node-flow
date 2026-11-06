import ApiReference from "./sections/ApiReference";
import ComponentsSection from "./sections/ComponentsSection";
import ExamplesSection from "./sections/ExamplesSection";
import GettingStarted from "./sections/GettingStarted";

const navigation = [
  { href: "#getting-started", label: "快速开始" },
  { href: "#api", label: "NodeFlow 参数" },
  { href: "#types", label: "数据结构" },
  { href: "#components", label: "内置组件" },
  { href: "#utilities", label: "工具与 Hooks" },
  { href: "#examples", label: "示例" },
];

export default function App() {
  return (
    <div className="site">
      <aside className="sidebar">
        <a className="brand" href="#top">
          React Node Flow
        </a>
        <p className="tagline">从零实现的节点流编辑器，为 React 而生。</p>
        <nav>
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a
          className="npm-link"
          href="https://www.npmjs.com/package/@fedkit/react-node-flow"
          target="_blank"
          rel="noreferrer"
        >
          @fedkit/react-node-flow ↗
        </a>
      </aside>

      <main id="top">
        <header className="hero">
          <p className="eyebrow">React node editor</p>
          <h1>React Node Flow</h1>
          <p className="lede">
            平移缩放画布、拖拽节点、拖出连接线，再配上缩略图与背景网格。没有第三方流程图依赖，
            所有交互都由自己实现。
          </p>
          <div className="badges">
            <span>TypeScript</span>
            <span>受控 / 非受控</span>
            <span>自定义节点与边</span>
            <span>5 种内置边</span>
          </div>
        </header>

        <GettingStarted />
        <ApiReference />
        <ComponentsSection />
        <ExamplesSection />

        <footer>
          <span>MIT License</span>
          <span>@fedkit/react-node-flow</span>
        </footer>
      </main>
    </div>
  );
}
