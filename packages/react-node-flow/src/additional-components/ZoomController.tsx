import useDispatch from "../hooks/useDispatch";
import useData from "../hooks/useData";

export default function ZoomController() {
  const dispatch = useDispatch();
  const data = useData();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => data.panZoom?.setViewport(data.defaultViewport)}>Reset</button>
      <button
        onClick={() =>
          dispatch({
            type: "setStore",
            payload: { key: "zoomOnScroll", value: !data.zoomOnScroll },
          })
        }
      >
        Wheel Zoom: {data.zoomOnScroll ? "On" : "Off"}
      </button>
      <button
        onClick={() =>
          dispatch({
            type: "setStore",
            payload: { key: "panOnScroll", value: !data.panOnScroll },
          })
        }
      >
        Wheel Pan: {data.panOnScroll ? "On" : "Off"}
      </button>
      <button
        onClick={() =>
          dispatch({
            type: "setStore",
            payload: { key: "zoomOnDoubleClick", value: !data.zoomOnDoubleClick },
          })
        }
      >
        Double Click: {data.zoomOnDoubleClick ? "On" : "Off"}
      </button>
      <button
        onClick={() =>
          dispatch({
            type: "setStore",
            payload: { key: "zoomOnPinch", value: !data.zoomOnPinch },
          })
        }
      >
        Pinch: {data.zoomOnPinch ? "On" : "Off"}
      </button>
    </div>
  );
}
