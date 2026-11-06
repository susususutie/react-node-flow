# React Node Flow

基于 React 的节点流编辑器 monorepo。

- `packages/react-node-flow` — 可发布的组件库（`@fedkit/react-node-flow`）
- `apps/website` — 组件库介绍、参数文档与示例站，部署在 GitHub Pages

## 开发

```bash
vp install
vp run dev    # 启动站点 http://localhost:5173
vp run ready  # check + test + build
```

## 目录

```
packages/react-node-flow/
  src/            组件、hooks、store、类型
  src/__tests__/  单元测试
apps/website/
  src/sections/   文档章节
  src/examples/   示例
  src/docs/       参数与组件数据
```

## 发布

版本号写在 `packages/react-node-flow/package.json`，提交后打同名 tag：

```bash
git tag v0.1.0
git push origin v0.1.0
```

两个 GitHub Actions 会被 tag 触发：

- `deploy-pages.yml` — 运行完整校验后把 `apps/website/dist` 发布到 GitHub Pages
- `publish-npm.yml` — 校验 tag 与包版本一致后发布到 npm

首次使用前需要：

1. 仓库 Settings → Pages → Source 选择 **GitHub Actions**
2. npm 包已配置 Trusted Publisher（OIDC），workflow 文件名为 `publish-npm.yml`，无需 NPM_TOKEN

站点 base 路径由 `GITHUB_REPOSITORY` 自动推导：项目页为 `/<repo>/`，`<user>.github.io` 为 `/`。

## 使用

```tsx
import { Background, Controls, NodeFlow } from "@fedkit/react-node-flow";
import "@fedkit/react-node-flow/style.css";
```

`NodeFlow` 默认宽高 100%，外层容器需要有确定高度。
