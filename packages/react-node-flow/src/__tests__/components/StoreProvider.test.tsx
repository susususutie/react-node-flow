import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import StoreProvider from "../../components/StoreProvider";
import useConfig from "../../hooks/useConfig";
import useData from "../../hooks/useData";
import useReactive from "../../hooks/useReactive";
import useDispatch from "../../hooks/useDispatch";

function ConfigConsumer() {
  const config = useConfig();
  return <div data-testid="config">{JSON.stringify(config)}</div>;
}

function DataConsumer() {
  const data = useData();
  return (
    <div data-testid="data">
      <span data-testid="minZoom">{data.minZoom}</span>
      <span data-testid="maxZoom">{data.maxZoom}</span>
      <span data-testid="nodesLength">{data.nodes.length}</span>
      <span data-testid="edgesLength">{data.edges.length}</span>
      <span data-testid="nodesControlled">{String(data.nodesControlled)}</span>
      <span data-testid="edgesControlled">{String(data.edgesControlled)}</span>
    </div>
  );
}

function ReactiveConsumer() {
  const reactive = useReactive();
  return (
    <div data-testid="reactive">
      <span data-testid="transform">{JSON.stringify(reactive.transform)}</span>
      <span data-testid="isPanning">{String(reactive.isPanning)}</span>
      <span data-testid="connectionInProgress">{String(reactive.connectionState !== null)}</span>
    </div>
  );
}

function DispatchConsumer() {
  const dispatch = useDispatch();
  return <div data-testid="dispatch">{typeof dispatch}</div>;
}

function Consumer() {
  return (
    <>
      <ConfigConsumer />
      <DataConsumer />
      <ReactiveConsumer />
      <DispatchConsumer />
    </>
  );
}

describe("StoreProvider", () => {
  it("provides DispatchContext with dispatch function", () => {
    render(
      <StoreProvider nfId="test">
        <DispatchConsumer />
      </StoreProvider>,
    );
    expect(screen.getByTestId("dispatch").textContent).toBe("function");
  });

  it("provides ConfigContext with nfId", () => {
    render(
      <StoreProvider nfId="my-flow">
        <ConfigConsumer />
      </StoreProvider>,
    );
    const config = JSON.parse(screen.getByTestId("config").textContent!);
    expect(config.nfId).toBe("my-flow");
  });

  it("provides DataContext with resolved props", () => {
    render(
      <StoreProvider nfId="test" minZoom={0.2} maxZoom={5}>
        <DataConsumer />
      </StoreProvider>,
    );
    expect(screen.getByTestId("minZoom").textContent).toBe("0.2");
    expect(screen.getByTestId("maxZoom").textContent).toBe("5");
  });

  it("provides ReactiveContext with transform and connection", () => {
    render(
      <StoreProvider nfId="test">
        <ReactiveConsumer />
      </StoreProvider>,
    );
    expect(screen.getByTestId("transform").textContent).toBe("[0,0,1]");
    expect(screen.getByTestId("isPanning").textContent).toBe("false");
    expect(screen.getByTestId("connectionInProgress").textContent).toBe("false");
  });

  it("sets nodesControlled when nodes prop provided", () => {
    const nodes = [{ id: "a", position: { x: 0, y: 0 } }] as any[];
    render(
      <StoreProvider nfId="test" nodes={nodes}>
        <DataConsumer />
      </StoreProvider>,
    );
    expect(screen.getByTestId("nodesControlled").textContent).toBe("true");
  });

  it("sets edgesControlled when edges prop provided", () => {
    const edges = [{ id: "e1", source: "a", target: "b" }] as any[];
    render(
      <StoreProvider nfId="test" edges={edges}>
        <DataConsumer />
      </StoreProvider>,
    );
    expect(screen.getByTestId("edgesControlled").textContent).toBe("true");
  });

  it("uses default values when no props provided", () => {
    render(
      <StoreProvider nfId="test">
        <DataConsumer />
      </StoreProvider>,
    );
    expect(screen.getByTestId("minZoom").textContent).toBe("0.5");
    expect(screen.getByTestId("maxZoom").textContent).toBe("2");
    expect(screen.getByTestId("nodesLength").textContent).toBe("0");
    expect(screen.getByTestId("edgesLength").textContent).toBe("0");
  });

  it("wraps children in correct context hierarchy", () => {
    render(
      <StoreProvider nfId="test">
        <Consumer />
      </StoreProvider>,
    );
    expect(screen.getByTestId("config")).toBeInTheDocument();
    expect(screen.getByTestId("data")).toBeInTheDocument();
    expect(screen.getByTestId("reactive")).toBeInTheDocument();
    expect(screen.getByTestId("dispatch")).toBeInTheDocument();
  });
});
