import type { ReactNode } from "react";
import useReactive from "../hooks/useReactive";

export default function Viewport({ children }: { children: ReactNode }) {
  const reactive = useReactive();
  const transform = `translate(${reactive.transform[0]}px,${reactive.transform[1]}px) scale(${reactive.transform[2]})`;

  return (
    <div
      className="node-flow__viewport"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        transformOrigin: "0 0",
        willChange: "transform",
        transform,
      }}
    >
      {children}
    </div>
  );
}
