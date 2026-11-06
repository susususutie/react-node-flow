import type { PointerEvent as ReactPointerEvent } from "react";
import type { HandleType, PositionType } from "../../types";
import useDispatch from "../../hooks/useDispatch";

type HandleProps = {
  id: string;
  nodeId: string;
  type: HandleType;
  position: PositionType;
};

export default function Handle(props: HandleProps) {
  const { id, nodeId, type, position } = props;
  const dispatch = useDispatch();

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();

    const handleRect = event.currentTarget.getBoundingClientRect();
    dispatch({
      type: "setConnectionStart",
      payload: {
        nodeId,
        handleId: id,
        type,
        position,
        x: handleRect.left + handleRect.width / 2,
        y: handleRect.top + handleRect.height / 2,
      },
    });
  };

  return (
    <div
      data-role="handle"
      data-handle-id={id}
      data-handle-pos={position}
      data-handle-type={type}
      data-nodeid={nodeId}
      className={`node-flow__handle node-flow__handle-${type} node-flow__handle-${position}`}
      onPointerDown={onPointerDown}
    />
  );
}
