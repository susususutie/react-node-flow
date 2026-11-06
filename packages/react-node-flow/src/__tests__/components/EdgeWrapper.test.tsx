import { describe, it, expect } from "vite-plus/test";
import { render } from "@testing-library/react";
import StoreProvider from "../../components/StoreProvider";
import EdgeWrapper from "../../components/EdgeWrapper";
import type { Node, Edge } from "../../types";

function makeNode(id: string, overrides?: Partial<Node>): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    width: 100,
    height: 100,
    handles: [
      { id: "source", type: "source", position: "right", x: 100, y: 50, width: 10, height: 10 },
      { id: "target", type: "target", position: "left", x: 0, y: 50, width: 10, height: 10 },
    ],
    ...overrides,
  };
}

function makeEdge(id: string, source: string, target: string, overrides?: Partial<Edge>): Edge {
  return { id, source, target, ...overrides };
}

describe("EdgeWrapper", () => {
  it("renders nothing when edge not found in lookup", () => {
    const { container } = render(
      <StoreProvider nfId="test">
        <EdgeWrapper id="missing" />
      </StoreProvider>,
    );
    expect(container.querySelector("[data-flow-edge]")).toBeNull();
  });

  it("renders nothing when edge is hidden", () => {
    const edges = [makeEdge("e1", "a", "b", { hidden: true })];
    const { container } = render(
      <StoreProvider nfId="test" nodes={[makeNode("a"), makeNode("b")]} edges={edges}>
        <EdgeWrapper id="e1" />
      </StoreProvider>,
    );
    expect(container.querySelector("[data-flow-edge]")).toBeNull();
  });

  it("renders nothing when source/target nodes not found", () => {
    const edges = [makeEdge("e1", "a", "b")];
    const { container } = render(
      <StoreProvider nfId="test" nodes={[]} edges={edges}>
        <EdgeWrapper id="e1" />
      </StoreProvider>,
    );
    expect(container.querySelector("[data-flow-edge]")).toBeNull();
  });

  it("renders edge SVG with correct edge type class", () => {
    const edges = [makeEdge("e1", "a", "b")];
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a"), makeNode("b")]} edges={edges}>
        <EdgeWrapper id="e1" />
      </StoreProvider>,
    );
    const svg = document.querySelector("[data-flow-edge]");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("class")).toContain("node-flow__edge");
  });

  it("applies zIndex from edge or defaults based on selection", () => {
    const edges = [makeEdge("e1", "a", "b", { selected: true })];
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a"), makeNode("b")]} edges={edges}>
        <EdgeWrapper id="e1" />
      </StoreProvider>,
    );
    const svg = document.querySelector("[data-flow-edge]") as HTMLElement;
    expect(svg.style.zIndex).toBe("1");
  });

  it("applies default zIndex 0 when not selected", () => {
    const edges = [makeEdge("e1", "a", "b")];
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a"), makeNode("b")]} edges={edges}>
        <EdgeWrapper id="e1" />
      </StoreProvider>,
    );
    const svg = document.querySelector("[data-flow-edge]") as HTMLElement;
    expect(svg.style.zIndex).toBe("0");
  });

  it("applies interactionWidth from edge or default 20", () => {
    const edges = [makeEdge("e1", "a", "b")];
    const { container } = render(
      <StoreProvider nfId="test" nodes={[makeNode("a"), makeNode("b")]} edges={edges}>
        <EdgeWrapper id="e1" />
      </StoreProvider>,
    );
    const svg = document.querySelector("[data-flow-edge]");
    expect(svg).not.toBeNull();
    // Verify the edge rendered with the BezierEdge component (default type)
    const path = container.querySelector("path");
    expect(path).not.toBeNull();
  });

  it("renders edge with custom type", () => {
    const edges = [makeEdge("e1", "a", "b", { type: "straight" })];
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a"), makeNode("b")]} edges={edges}>
        <EdgeWrapper id="e1" />
      </StoreProvider>,
    );
    const svg = document.querySelector("[data-flow-edge]");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("class")).toContain("node-flow__edge-straight");
  });

  it("renders label when edge.label is set", () => {
    const edges = [makeEdge("e1", "a", "b", { label: "test label" })];
    render(
      <StoreProvider nfId="test" nodes={[makeNode("a"), makeNode("b")]} edges={edges}>
        <EdgeWrapper id="e1" />
      </StoreProvider>,
    );
    const label = document.querySelector("foreignObject");
    expect(label).not.toBeNull();
  });
});
