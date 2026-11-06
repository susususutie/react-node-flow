import { useMemo, type ReactNode } from "react";

export type PanelProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  children?: ReactNode;
  style?: React.CSSProperties;
};

export default function Panel(props: PanelProps) {
  const { position = "bottom-right", children, style: panelStyle } = props;

  const style: React.CSSProperties = useMemo(
    () => ({
      margin: 15,
      position: "absolute",
      zIndex: 5,
      top: position === "top-left" || position === "top-right" ? 0 : undefined,
      left: position === "top-left" || position === "bottom-left" ? 0 : undefined,
      right: position === "top-right" || position === "bottom-right" ? 0 : undefined,
      bottom: position === "bottom-left" || position === "bottom-right" ? 0 : undefined,
    }),
    [position],
  );

  return <div style={{ ...style, ...panelStyle }}>{children}</div>;
}
