import { describe, it, expect } from "vite-plus/test";
import { render } from "@testing-library/react";
import StoreProvider from "../../components/StoreProvider";
import NodeWrapper from "../../components/NodeWrapper";
import type { Node } from "../../types";

function makeNode(id: string, overrides?: Partial<Node>): Node {
  return { id, position: { x: 100, y: 200 }, ...overrides };
}

function NodeRenderer({ nodeId }: { nodeId: string }) {
  return (
    <StoreProvider nfId="test" nodes={[makeNode(nodeId)]}>
      <NodeWrapper
        nfId="test"
        id={nodeId}
        nodesDraggable={true}
        nodesSelectable={true}
        nodesConnectable={true}
        resizeObserver={null}
      />
    </StoreProvider>
  );
}

describe("NodeWrapper", () => {
  it("renders nothing when node not found in lookup", () => {
    const { container } = render(
      <StoreProvider nfId="test">
        <NodeWrapper
          nfId="test"
          id="missing"
          nodesDraggable={true}
          nodesSelectable={true}
          nodesConnectable={true}
          resizeObserver={null}
        />
      </StoreProvider>,
    );
    expect(container.querySelector("[data-id='missing']")).toBeNull();
  });

  it("renders nothing when node.hidden is true", () => {
    const { container } = render(
      <StoreProvider nfId="test" nodes={[makeNode("a", { hidden: true })]}>
        <NodeWrapper
          nfId="test"
          id="a"
          nodesDraggable={true}
          nodesSelectable={true}
          nodesConnectable={true}
          resizeObserver={null}
        />
      </StoreProvider>,
    );
    expect(container.querySelector("[data-id='a']")).toBeNull();
  });

  it("renders node with correct translate transform", () => {
    render(<NodeRenderer nodeId="a" />);
    const node = document.querySelector("[data-id='a']");
    expect(node).not.toBeNull();
    const style = (node as HTMLElement).style;
    expect(style.transform).toContain("translate(100px, 200px)");
  });

  it("renders node with correct zIndex", () => {
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a", { zIndex: 10 })]}>
        <NodeWrapper
          nfId="test"
          id="a"
          nodesDraggable={true}
          nodesSelectable={true}
          nodesConnectable={true}
          resizeObserver={null}
        />
      </StoreProvider>,
    );
    const node = document.querySelector("[data-id='a']") as HTMLElement;
    expect(node.style.zIndex).toBe("10");
  });

  it("adds dragging and draggable classes when node.dragging is true", () => {
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a", { dragging: true })]}>
        <NodeWrapper
          nfId="test"
          id="a"
          nodesDraggable={true}
          nodesSelectable={true}
          nodesConnectable={true}
          resizeObserver={null}
        />
      </StoreProvider>,
    );
    const node = document.querySelector("[data-id='a']") as HTMLElement;
    expect(node.classList.contains("draggable")).toBe(true);
    expect(node.classList.contains("dragging")).toBe(true);
  });

  it("adds draggable and selectable classes when draggable", () => {
    render(<NodeRenderer nodeId="a" />);
    const node = document.querySelector("[data-id='a']") as HTMLElement;
    expect(node.classList.contains("draggable")).toBe(true);
    expect(node.classList.contains("selectable")).toBe(true);
    expect(node.classList.contains("dragging")).toBe(false);
  });

  it("adds selected class when node is selected", () => {
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a", { selected: true })]}>
        <NodeWrapper
          nfId="test"
          id="a"
          nodesDraggable={true}
          nodesSelectable={true}
          nodesConnectable={true}
          resizeObserver={null}
        />
      </StoreProvider>,
    );
    const node = document.querySelector("[data-id='a']") as HTMLElement;
    expect(node.classList.contains("selected")).toBe(true);
    expect(node.style.border).toBe("");
  });

  it("omits draggable class when node is not draggable", () => {
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a")]}>
        <NodeWrapper
          nfId="test"
          id="a"
          nodesDraggable={false}
          nodesSelectable={true}
          nodesConnectable={true}
          resizeObserver={null}
        />
      </StoreProvider>,
    );
    const node = document.querySelector("[data-id='a']") as HTMLElement;
    expect(node.classList.contains("draggable")).toBe(false);
    expect(node.classList.contains("selectable")).toBe(true);
  });

  it("renders data-flow-node attribute", () => {
    render(<NodeRenderer nodeId="a" />);
    const node = document.querySelector("[data-flow-node]");
    expect(node).not.toBeNull();
  });

  it("has correct className with node type", () => {
    render(<NodeRenderer nodeId="a" />);
    const node = document.querySelector("[data-id='a']") as HTMLElement;
    expect(node.className).toContain("node-flow__node");
    expect(node.className).toContain("node-flow__node-default");
  });
});
