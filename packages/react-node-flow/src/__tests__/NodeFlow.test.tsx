import { describe, it, expect } from "vite-plus/test";
import { render } from "@testing-library/react";
import NodeFlow from "../NodeFlow";

let renderCount = 0;
function RenderCounter() {
  renderCount++;
  return null;
}

describe("NodeFlow", () => {
  it("renders wrapper div with id from props", () => {
    render(<NodeFlow id="my-flow" />);
    expect(document.getElementById("my-flow")).not.toBeNull();
  });

  it("auto-generates id when not provided", () => {
    render(<NodeFlow />);
    const wrapper = document.querySelector(".node-flow__renderer")?.parentElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper!.id).toMatch(/^NodeFlow-/);
  });

  it("merges wrapperStyle with custom style prop", () => {
    render(<NodeFlow style={{ backgroundColor: "red" }} />);
    const wrapper = document.querySelector(".node-flow__renderer")?.parentElement as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.backgroundColor).toBe("red");
    expect(wrapper.style.overflow).toBe("hidden");
  });

  it("renders children inside the component tree", () => {
    render(
      <NodeFlow>
        <div data-testid="child">test content</div>
      </NodeFlow>,
    );
    expect(document.querySelector("[data-testid='child']")).not.toBeNull();
  });

  it("does not re-render when style values are deeply equal", () => {
    renderCount = 0;
    const child = <RenderCounter />;
    const { rerender } = render(<NodeFlow style={{ color: "red" }}>{child}</NodeFlow>);
    const countAfterInitial = renderCount;
    // Rerender with a new style object containing the same values, same child reference
    rerender(<NodeFlow style={{ color: "red" }}>{child}</NodeFlow>);
    rerender(<NodeFlow style={{ color: "red" }}>{child}</NodeFlow>);
    // RenderCounter should not have been called again (memo prevented re-render)
    expect(renderCount).toBe(countAfterInitial);
  });

  it("re-renders when non-style props change", () => {
    renderCount = 0;
    const { rerender } = render(
      <NodeFlow style={{ color: "red" }}>
        <RenderCounter />
      </NodeFlow>,
    );
    const countAfterInitial = renderCount;
    rerender(
      <NodeFlow minZoom={0.2} style={{ color: "red" }}>
        <RenderCounter />
      </NodeFlow>,
    );
    expect(renderCount).toBeGreaterThan(countAfterInitial);
  });

  it("applies overscrollBehavior: none", () => {
    render(<NodeFlow />);
    const wrapper = document.querySelector(".node-flow__renderer")?.parentElement as HTMLElement;
    expect(wrapper.style.overscrollBehavior).toBe("none");
  });

  it("applies position: relative", () => {
    render(<NodeFlow />);
    const wrapper = document.querySelector(".node-flow__renderer")?.parentElement as HTMLElement;
    expect(wrapper.style.position).toBe("relative");
  });

  it("passes HTML div props through", () => {
    render(<NodeFlow className="custom-class" data-testid="root" />);
    const wrapper = document.querySelector(".custom-class");
    expect(wrapper).not.toBeNull();
    expect(wrapper!.getAttribute("data-testid")).toBe("root");
  });
});
