import { useCallback } from "react";
import Panel from "../../components/Panel";
import useData from "../../hooks/useData";
import useDispatch from "../../hooks/useDispatch";
import useReactive from "../../hooks/useReactive";
import FitViewIcon from "./FitViewIcon";
import LockIcon from "./LockIcon";
import MinusIcon from "./MinusIcon";
import PlusIcon from "./PlusIcon";
import UnlockIcon from "./UnlockIcon";
import "./index.css";

type ControlsProps = {
  showZoom?: boolean;
  showFitView?: boolean;
  showInteractive?: boolean;
  fitViewOptions?: { padding?: number };
};

export default function Controls(props: ControlsProps) {
  const { showZoom = true, showFitView = true, showInteractive = true, fitViewOptions } = props;
  const data = useData();
  const dispatch = useDispatch();
  const panZoom = data.panZoom;
  const reactive = useReactive();

  const minZoomReached = reactive.transform[2] <= data.minZoom;
  const maxZoomReached = reactive.transform[2] >= data.maxZoom;

  const handleZoomIn = useCallback(() => {
    if (maxZoomReached || !panZoom) return;
    panZoom.zoomIn();
  }, [maxZoomReached, panZoom]);

  const handleZoomOut = useCallback(() => {
    if (minZoomReached || !panZoom) return;
    panZoom.zoomOut();
  }, [minZoomReached, panZoom]);

  const handleFitView = useCallback(() => {
    if (!panZoom) return;
    const nodes = Array.from(data.nodeLookup.values())
      .filter((n) => !n.hidden)
      .map((n) => ({
        x: n.internals.positionAbsolute.x,
        y: n.internals.positionAbsolute.y,
        width: n.internals.measured.width ?? 100,
        height: n.internals.measured.height ?? 50,
      }));
    if (nodes.length === 0) return;
    panZoom.fitView(nodes, fitViewOptions ? { padding: fitViewOptions.padding } : undefined);
  }, [panZoom, data.nodeLookup, fitViewOptions]);

  const isInteractive = data.nodesSelectable || data.nodesDraggable || data.nodesConnectable;
  const handleToggleInteractivity = useCallback(() => {
    dispatch({ type: "toggleInteractivity" });
  }, [dispatch]);
  return (
    <Panel
      position="bottom-left"
      style={{
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 2px 1px rgba(0, 0, 0, .08)",
      }}
    >
      {showZoom ? (
        <>
          <button className="control-button" disabled={maxZoomReached} onClick={handleZoomIn}>
            <PlusIcon />
          </button>
          <button className="control-button" disabled={minZoomReached} onClick={handleZoomOut}>
            <MinusIcon />
          </button>
        </>
      ) : null}
      {showFitView ? (
        <button className="control-button" onClick={handleFitView}>
          <FitViewIcon />
        </button>
      ) : null}
      {showInteractive ? (
        <button className="control-button" onClick={handleToggleInteractivity}>
          {isInteractive ? <UnlockIcon /> : <LockIcon />}
        </button>
      ) : null}
    </Panel>
  );
}
