import type { PropDoc } from "./props";

export type ComponentDoc = {
  name: string;
  summary: string;
  props: PropDoc[];
};

const positionProp: PropDoc = {
  name: "position",
  type: '"top-left" | "top-right" | "bottom-left" | "bottom-right"',
  defaultValue: '"bottom-right"',
  description: "相对画布的停靠位置。",
};

export const componentDocs: ComponentDoc[] = [
  {
    name: "Background",
    summary: "网格背景，支持点、线、十字三种样式，随视口平移缩放。",
    props: [
      { name: "id", type: "string", description: "同一画布中渲染多个背景时用于区分 pattern。" },
      {
        name: "variant",
        type: '"dots" | "lines" | "cross"',
        defaultValue: '"dots"',
        description: "背景图案类型。",
      },
      {
        name: "gap",
        type: "number | [number, number]",
        defaultValue: "20",
        description: "图案间距。",
      },
      { name: "size", type: "number", description: "点或十字的尺寸，默认 1。" },
      {
        name: "offset",
        type: "number | [number, number]",
        defaultValue: "0",
        description: "图案偏移。",
      },
      {
        name: "lineWidth",
        type: "number",
        defaultValue: "1",
        description: "线条宽度，仅 lines 与 cross 生效。",
      },
      { name: "color", type: "string", description: "图案颜色，按 variant 提供默认值。" },
      { name: "bgColor", type: "string", defaultValue: '"transparent"', description: "背景底色。" },
    ],
  },
  {
    name: "Controls",
    summary: "左下角的缩放、自适应视图与交互锁定按钮组。",
    props: [
      {
        name: "showZoom",
        type: "boolean",
        defaultValue: "true",
        description: "显示放大/缩小按钮。",
      },
      {
        name: "showFitView",
        type: "boolean",
        defaultValue: "true",
        description: "显示自适应视图按钮。",
      },
      {
        name: "showInteractive",
        type: "boolean",
        defaultValue: "true",
        description: "显示交互锁定按钮，一键切换拖动、连接和选中。",
      },
      {
        name: "fitViewOptions",
        type: "{ padding?: number }",
        description: "自适应视图的内边距。",
      },
    ],
  },
  {
    name: "MiniMap",
    summary: "右下角的缩略图，显示全部节点和当前视口范围，支持点击与拖拽移动视口。",
    props: [
      positionProp,
      {
        name: "nodeColor",
        type: "string | ((node) => string)",
        defaultValue: '"#ddd"',
        description: "节点颜色，可传函数按节点计算。",
      },
      { name: "nodeStrokeWidth", type: "number", defaultValue: "2", description: "节点边框宽度。" },
      { name: "nodeBorderRadius", type: "number", defaultValue: "2", description: "节点圆角。" },
      {
        name: "maskColor",
        type: "string",
        defaultValue: '"rgba(0, 0, 0, 0.1)"',
        description: "视口外遮罩颜色。",
      },
      {
        name: "pannable",
        type: "boolean",
        defaultValue: "true",
        description: "是否允许在缩略图上拖拽移动视口。",
      },
      { name: "style", type: "CSSProperties", description: "缩略图容器样式。" },
    ],
  },
  {
    name: "Toolbar",
    summary: "通用的浮动面板容器，用 position 控制停靠位置，适合放置自定义控件。",
    props: [positionProp, { name: "children", type: "ReactNode", description: "面板内容。" }],
  },
  {
    name: "Panel",
    summary: "绝对定位的面板基座，Toolbar 与 Controls 都基于它实现。",
    props: [
      positionProp,
      { name: "style", type: "CSSProperties", description: "追加到面板的样式。" },
      { name: "children", type: "ReactNode", description: "面板内容。" },
    ],
  },
  {
    name: "DisplayZoom",
    summary: "显示当前缩放比例，以及节点是否完成首次测量。无 props。",
    props: [],
  },
  {
    name: "ZoomController",
    summary: "一组调试用开关：重置视口、滚轮缩放、滚轮平移、双击缩放、捏合缩放。无 props。",
    props: [],
  },
  {
    name: "Handle",
    summary: "自定义节点使用的连接点，点击后进入连线状态。",
    props: [
      {
        name: "id",
        type: "string",
        description: "连接点 id，对应边的 sourceHandle / targetHandle。",
      },
      { name: "nodeId", type: "string", description: "所属节点 id。" },
      { name: "type", type: '"source" | "target"', description: "连接点方向。" },
      {
        name: "position",
        type: '"left" | "right" | "top" | "bottom"',
        description: "连接点在节点上的位置。",
      },
    ],
  },
];

export const utilityDocs: PropDoc[] = [
  {
    name: "exportFlow(nodes, edges)",
    type: "() => string",
    description: "把节点和边序列化为带 version 的 JSON 字符串。",
  },
  {
    name: "exportFlowAsObject(nodes, edges)",
    type: "() => FlowExportData",
    description: "返回可序列化的导出对象。",
  },
  {
    name: "importFlow(json)",
    type: "() => { nodes; edges } | null",
    description: "解析导出的 JSON，格式非法时返回 null。",
  },
  {
    name: "importFlowFromObject(data)",
    type: "() => { nodes; edges } | null",
    description: "从对象导入，并过滤掉缺少 id 的节点和边。",
  },
  {
    name: "useUndoRedo(options?)",
    type: "(options?: { maxHistory?: number }) => UndoRedoApi",
    description: "维护快照历史，提供 undo/redo/canUndo/canRedo/takeSnapshot。",
  },
  {
    name: "useUndoRedoFlow(restore, options?)",
    type: "(restore, options?) => UndoRedoFlowApi",
    description: "在 undo/redo 时通过 restore 回调把历史状态写回你的数据源。",
  },
];
