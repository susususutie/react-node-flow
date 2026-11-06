export type PropDoc = {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
};

export type PropGroup = {
  title: string;
  props: PropDoc[];
};

export const nodeFlowPropGroups: PropGroup[] = [
  {
    title: "基础",
    props: [
      {
        name: "id",
        type: "string",
        description: "容器 id，同时作为内部 nfId 使用；不传时自动生成。",
      },
      {
        name: "className",
        type: "string",
        description: "追加到根容器的 class，根节点固定带有 node-flow。",
      },
      {
        name: "style",
        type: "CSSProperties",
        description: "追加到根容器的内联样式，会覆盖默认的宽高和 overflow。",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "画布上的附加组件，如 Background、Controls、MiniMap、Toolbar。",
      },
    ],
  },
  {
    title: "节点",
    props: [
      {
        name: "defaultNodes",
        type: "N[]",
        description: "非受控模式的初始节点，仅在首次渲染时采用。",
      },
      {
        name: "nodes",
        type: "N[]",
        description: "受控节点。传入后节点变更通过 onNodesChange 交由外部维护。",
      },
      {
        name: "onNodesChange",
        type: "(changes: NodeChange[]) => void",
        description: "节点变化回调，覆盖移动、选中、删除和新增。",
      },
      {
        name: "nodeTypes",
        type: "NodeTypes<N>",
        defaultValue: "{}",
        description: "自定义节点映射表，key 对应 node.type；需在组件外或 useMemo 中定义。",
      },
      {
        name: "nodesDraggable",
        type: "boolean",
        defaultValue: "true",
        description: "是否允许拖动节点，可被节点自身的 draggable 覆盖。",
      },
      {
        name: "nodesConnectable",
        type: "boolean",
        defaultValue: "true",
        description: "是否允许节点建立连接，可被节点自身的 connectable 覆盖。",
      },
      {
        name: "nodesSelectable",
        type: "boolean",
        defaultValue: "true",
        description: "是否允许选中节点，可被节点自身的 selectable 覆盖。",
      },
    ],
  },
  {
    title: "边与连接",
    props: [
      {
        name: "defaultEdges",
        type: "E[]",
        description: "非受控模式的初始边，仅在首次渲染时采用。",
      },
      {
        name: "edges",
        type: "E[]",
        description: "受控边。传入后边变更通过 onEdgesChange 交由外部维护。",
      },
      {
        name: "onEdgesChange",
        type: "(changes: EdgeChange[]) => void",
        description: "边变化回调，覆盖选中、删除和新增。",
      },
      {
        name: "edgeTypes",
        type: "EdgeTypes<E>",
        defaultValue: "{}",
        description:
          "自定义边映射表，key 对应 edge.type；内置 bezier、straight、step、smoothstep、simplebezier。",
      },
      {
        name: "onConnect",
        type: "(connection: Connection) => void",
        description: "连接完成时触发，需要在回调中自行把新边写入数据。",
      },
      {
        name: "isValidConnection",
        type: "(connection: Connection) => boolean",
        description: "连接校验函数，返回 false 阻止连接。",
      },
    ],
  },
  {
    title: "视口",
    props: [
      {
        name: "defaultViewport",
        type: "Viewport",
        defaultValue: "{ x: 0, y: 0, zoom: 1 }",
        description: "非受控模式的初始视口。",
      },
      {
        name: "viewport",
        type: "Viewport",
        description: "受控视口，变化时触发 onViewportChange。",
      },
      {
        name: "onViewportChange",
        type: "(viewport: Viewport) => void",
        description: "视口变化回调，用于受控模式同步 transform。",
      },
      {
        name: "minZoom",
        type: "number",
        defaultValue: "0.5",
        description: "最小缩放比例。",
      },
      {
        name: "maxZoom",
        type: "number",
        defaultValue: "2",
        description: "最大缩放比例。",
      },
    ],
  },
  {
    title: "交互",
    props: [
      {
        name: "zoomOnScroll",
        type: "boolean",
        defaultValue: "true",
        description: "滚轮缩放。开启 panOnScroll 后，仅在按住 Ctrl 时缩放。",
      },
      {
        name: "zoomOnPinch",
        type: "boolean",
        defaultValue: "true",
        description: "触摸板双指捏合与 Safari gesture 缩放。",
      },
      {
        name: "zoomOnDoubleClick",
        type: "boolean",
        defaultValue: "true",
        description: "双击放大。",
      },
      {
        name: "panOnScroll",
        type: "boolean",
        defaultValue: "false",
        description: "滚轮平移。与 zoomOnScroll 同时开启时，默认平移、按住 Ctrl 缩放。",
      },
      {
        name: "preventScrolling",
        type: "boolean",
        defaultValue: "true",
        description: "指针位于画布上时阻止页面滚动；节点内部滚动区可加 data-flow-no-wheel 跳过。",
      },
    ],
  },
  {
    title: "事件",
    props: [
      {
        name: "onNodeDrag",
        type: "(event, node, nodes) => void",
        description: "节点拖动过程中持续触发。",
      },
      {
        name: "onNodeDragStart",
        type: "(event, node, nodes) => void",
        description: "节点开始拖动时触发。",
      },
      {
        name: "onNodeDragStop",
        type: "(event, node, nodes) => void",
        description: "节点拖动结束时触发。",
      },
      {
        name: "onNodeClick",
        type: "(event, node) => void",
        description: "点击节点时触发。",
      },
      {
        name: "onNodeDoubleClick",
        type: "(event, node) => void",
        description: "双击节点时触发。",
      },
      {
        name: "onEdgeClick",
        type: "(event, edge) => void",
        description: "点击边时触发。",
      },
      {
        name: "onPaneClick",
        type: "(event) => void",
        description: "点击画布空白区域时触发。",
      },
    ],
  },
  {
    title: "网格",
    props: [
      {
        name: "snapToGrid",
        type: "boolean",
        defaultValue: "false",
        description: "拖动时把节点位置吸附到网格。",
      },
      {
        name: "snapGrid",
        type: "[number, number]",
        defaultValue: "[15, 15]",
        description: "吸附网格的横向与纵向间距。",
      },
    ],
  },
];

export const nodeFields: PropDoc[] = [
  { name: "id", type: "string", description: "节点唯一标识，必填。" },
  {
    name: "position",
    type: "{ x: number; y: number }",
    description: "相对父节点或画布的坐标，必填。",
  },
  {
    name: "type",
    type: "string",
    defaultValue: '"default"',
    description: "节点类型，对应 nodeTypes 的 key；内置 default、input、output。",
  },
  {
    name: "data",
    type: "Record<string, unknown>",
    description: "业务数据，会原样传给节点组件。",
  },
  {
    name: "width / height",
    type: "number",
    description: "固定尺寸。不传时渲染后测量。",
  },
  {
    name: "handles",
    type: "Handle[]",
    description: "连接点定义，包含 id、type、position 及可选的偏移和尺寸。",
  },
  {
    name: "parentNode",
    type: "string",
    description: "父节点 id，用于子流程。",
  },
  {
    name: "origin",
    type: "[number, number]",
    defaultValue: "[0, 0]",
    description: "坐标原点，[0,0] 为左上角，[1,1] 为右下角。",
  },
  {
    name: "extent",
    type: '"parent" | { left; top; right; bottom }',
    description: "限制节点可移动范围。",
  },
  {
    name: "draggable / selectable / connectable / deletable",
    type: "boolean",
    description: "覆盖画布级别的同类配置。",
  },
  { name: "hidden", type: "boolean", defaultValue: "false", description: "隐藏节点。" },
  { name: "zIndex", type: "number", description: "节点层级。" },
  { name: "style / className", type: "CSSProperties / string", description: "节点容器的样式。" },
];

export const edgeFields: PropDoc[] = [
  { name: "id", type: "string", description: "边唯一标识，必填。" },
  { name: "source / target", type: "string", description: "起点与终点节点 id，必填。" },
  {
    name: "sourceHandle / targetHandle",
    type: "string | null",
    description: "指定连接使用的 handle id。",
  },
  {
    name: "type",
    type: "string",
    defaultValue: '"bezier"',
    description:
      "边类型，内置 bezier、straight、step、smoothstep、simplebezier，也可对应 edgeTypes。",
  },
  { name: "data", type: "Record<string, unknown>", description: "业务数据，会传给自定义边组件。" },
  { name: "label", type: "string | ReactNode", description: "显示在边中点的标签。" },
  { name: "animated", type: "boolean", defaultValue: "false", description: "是否使用流动动画。" },
  {
    name: "markerStart / markerEnd",
    type: "Marker | string",
    description: "端点标记。内置 arrowclosed、arrow、circle、diamond，也支持自定义 render。",
  },
  { name: "style / className", type: "CSSProperties / string", description: "边的样式。" },
  { name: "hidden", type: "boolean", defaultValue: "false", description: "隐藏边。" },
  { name: "deletable / selectable", type: "boolean", description: "是否允许删除、选中。" },
  { name: "interactionWidth", type: "number", description: "扩大点击命中区域的宽度。" },
];

export const sharedTypes: PropDoc[] = [
  {
    name: "Viewport",
    type: "{ x: number; y: number; zoom: number }",
    description: "视口平移与缩放状态，x/y 为屏幕像素偏移。",
  },
  {
    name: "XYPosition",
    type: "{ x: number; y: number }",
    description: "画布坐标。",
  },
  {
    name: "Connection",
    type: "{ source; target; sourceHandle?; targetHandle? }",
    description: "一次连接的结果，onConnect 与 isValidConnection 的参数。",
  },
  {
    name: "NodeChange",
    type: "select | position | remove | add",
    description: "节点变更联合类型，position 变更会带上最新坐标和 dragging 状态。",
  },
  {
    name: "EdgeChange",
    type: "select | remove | add",
    description: "边变更联合类型。",
  },
  {
    name: "NodeProps<N>",
    type: "{ id; data; type; ... }",
    description: "注入给自定义节点组件的 props，额外包含 nfId 和绝对坐标。",
  },
  {
    name: "EdgeProps<E>",
    type: "{ id; sourceX; sourceY; ... }",
    description: "注入给自定义边组件的 props，包含端点坐标与位置。",
  },
];
