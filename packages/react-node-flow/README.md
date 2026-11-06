NodeFlow 组件层级及 DOM 对照

```jsx
<NodeFlow className="node-flow">                                           {/* relative,overflow:hidden; */}
  <NodeFlowProvider>
    <StoreUpdater />                                                       {/* 数据同步 */}
    <ZoomPane className="node-flow__renderer">                             {/* absolute,width/height:100% */}
      <Pane className="node-flow__pane">                                   {/* 事件捕获层, 平移、取消选中 */}
        <Viewport className="node-flow__viewport">                         {/* 视口变换层, transform 实现位移/缩放 */}
          <EdgeRenderer className="node-flow__edges" />                    {/* 边层 */}
          <ConnectionLineWrapper className="node-flow__connectionline" />  {/* svg 临时连接线 */}
          <div className="node-flow__edgelabel-renderer" />                {/* absolute, 渲染自定义label */}
          <NodeRenderer className="node-flow__nodes" />                    {/* 节点层 */}
          <div className="node-flow__viewport-portal" />
        </Viewport>
        <UserSelection className="node-flow__selection" />                 {/* 框选矩形 */}
        <NodesSelection className="node-flow__nodesselection" />
      </Pane>
    <ZoomPane />
    <SelectionListener />
      {children}                                                           {/* MiniMap/Controls 等组件 */}
    <Attribution className="node-flow__attribution" />                     {/* absolute, 底部 attribution */}
    <A11yDescriptions />                                                   {/* absolute, 底部 a11y 描述 */}
  </NodeFlowProvider>
</NodeFlow>
```
