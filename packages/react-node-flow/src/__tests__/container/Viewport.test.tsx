import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import StoreProvider from "../../components/StoreProvider";
import Viewport from "../../container/Viewport";

function ViewportConsumer() {
  return (
    <StoreProvider nfId="test">
      <Viewport>
        <div data-testid="child">child content</div>
      </Viewport>
    </StoreProvider>
  );
}

describe("Viewport", () => {
  it("renders children inside the viewport div", () => {
    render(<ViewportConsumer />);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies CSS transform from reactive state", () => {
    render(<ViewportConsumer />);
    const viewport = document.querySelector(".node-flow__viewport") as HTMLElement;
    expect(viewport).not.toBeNull();
    expect(viewport.style.transform).toBe("translate(0px,0px) scale(1)");
  });

  it("sets will-change: transform for GPU acceleration", () => {
    render(<ViewportConsumer />);
    const viewport = document.querySelector(".node-flow__viewport") as HTMLElement;
    expect(viewport.style.willChange).toBe("transform");
  });

  it("sets transform-origin: 0 0", () => {
    render(<ViewportConsumer />);
    const viewport = document.querySelector(".node-flow__viewport") as HTMLElement;
    expect(viewport.style.transformOrigin).toBe("0 0");
  });

  it("has correct position and size styles", () => {
    render(<ViewportConsumer />);
    const viewport = document.querySelector(".node-flow__viewport") as HTMLElement;
    expect(viewport.style.position).toBe("absolute");
    expect(viewport.style.width).toBe("100%");
    expect(viewport.style.height).toBe("100%");
  });
});
