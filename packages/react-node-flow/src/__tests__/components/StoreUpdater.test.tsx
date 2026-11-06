import { describe, it, expect } from "vite-plus/test";
import { render, act } from "@testing-library/react";
import StoreProvider from "../../components/StoreProvider";
import StoreUpdater from "../../components/StoreUpdater";
import DispatchContext from "../../contexts/DispatchContext";
import { type StoreAction } from "../../types";
import { type ReactNode, useCallback, useRef } from "react";

function SpyDispatch({
  spy,
  children,
}: {
  spy: React.MutableRefObject<((action: StoreAction) => void) | null>;
  children: ReactNode;
}) {
  const dispatch = useCallback(
    (action: StoreAction) => {
      spy.current?.(action);
    },
    [spy],
  );
  return <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>;
}

function TestWrapper({
  children,
  onDispatch,
}: {
  children: ReactNode;
  onDispatch?: (action: StoreAction) => void;
}) {
  const spyRef = useRef<((action: StoreAction) => void) | null>(null);
  spyRef.current = onDispatch ?? null;

  return (
    <StoreProvider nfId="test">
      <SpyDispatch spy={spyRef}>{children}</SpyDispatch>
    </StoreProvider>
  );
}

describe("StoreUpdater", () => {
  it("renders null (no DOM output)", () => {
    const { container } = render(
      <TestWrapper>
        <StoreUpdater nfId="test" />
      </TestWrapper>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("dispatches setMinZoom when minZoom prop changes", () => {
    const actions: StoreAction[] = [];
    const { rerender } = render(
      <TestWrapper onDispatch={(a) => actions.push(a)}>
        <StoreUpdater nfId="test" minZoom={0.5} />
      </TestWrapper>,
    );
    act(() => {
      rerender(
        <TestWrapper onDispatch={(a) => actions.push(a)}>
          <StoreUpdater nfId="test" minZoom={0.2} />
        </TestWrapper>,
      );
    });
    expect(actions.some((a) => a.type === "setMinZoom" && (a as any).payload === 0.2)).toBe(true);
  });

  it("dispatches setMaxZoom when maxZoom prop changes", () => {
    const actions: StoreAction[] = [];
    const { rerender } = render(
      <TestWrapper onDispatch={(a) => actions.push(a)}>
        <StoreUpdater nfId="test" maxZoom={2} />
      </TestWrapper>,
    );
    act(() => {
      rerender(
        <TestWrapper onDispatch={(a) => actions.push(a)}>
          <StoreUpdater nfId="test" maxZoom={5} />
        </TestWrapper>,
      );
    });
    expect(actions.some((a) => a.type === "setMaxZoom" && (a as any).payload === 5)).toBe(true);
  });

  it("dispatches syncViewport when viewport prop changes", () => {
    const actions: StoreAction[] = [];
    const viewport = { x: 10, y: 20, zoom: 1.5 };
    const { rerender } = render(
      <TestWrapper onDispatch={(a) => actions.push(a)}>
        <StoreUpdater nfId="test" />
      </TestWrapper>,
    );
    act(() => {
      rerender(
        <TestWrapper onDispatch={(a) => actions.push(a)}>
          <StoreUpdater nfId="test" viewport={viewport} />
        </TestWrapper>,
      );
    });
    expect(actions.some((a) => a.type === "syncViewport")).toBe(true);
  });

  it("sets nodesControlled to true when nodes prop becomes defined", () => {
    const actions: StoreAction[] = [];
    const nodes = [{ id: "a", position: { x: 0, y: 0 } }] as any[];
    const { rerender } = render(
      <TestWrapper onDispatch={(a) => actions.push(a)}>
        <StoreUpdater nfId="test" />
      </TestWrapper>,
    );
    act(() => {
      rerender(
        <TestWrapper onDispatch={(a) => actions.push(a)}>
          <StoreUpdater nfId="test" nodes={nodes} />
        </TestWrapper>,
      );
    });
    expect(
      actions.some(
        (a) =>
          a.type === "setStore" &&
          (a as any).payload.key === "nodesControlled" &&
          (a as any).payload.value === true,
      ),
    ).toBe(true);
  });

  it("does not dispatch when prop values are identical (reference equal)", () => {
    const actions: StoreAction[] = [];
    const nodes = [{ id: "a", position: { x: 0, y: 0 } }] as any[];
    const { rerender } = render(
      <TestWrapper onDispatch={(a) => actions.push(a)}>
        <StoreUpdater nfId="test" nodes={nodes} />
      </TestWrapper>,
    );
    // Clear initial render actions
    actions.length = 0;
    act(() => {
      rerender(
        <TestWrapper onDispatch={(a) => actions.push(a)}>
          <StoreUpdater nfId="test" nodes={nodes} />
        </TestWrapper>,
      );
    });
    // No new setStore dispatches should occur on rerender since props are reference-equal
    expect(actions).toHaveLength(0);
  });
});
