import { useMemo, type ReactNode } from "react";
import Panel, { type PanelProps } from "../components/Panel";

type ToolbarProps = Pick<PanelProps, "position"> & {
  children: ReactNode;
};

export default function Toolbar(props: ToolbarProps) {
  const { position = "bottom-right", children } = props;

  const style: React.CSSProperties = useMemo(
    () => ({
      padding: 8,
      display: "flex",
      flexDirection: "column",
      justifyContent:
        position === "top-left" || position === "bottom-left" ? "flex-start" : "flex-end",
      alignItems:
        position === "top-left" || position === "bottom-right" ? "flex-start" : "flex-end",
      gap: 16,
      boxShadow: "0 0 2px 1px rgba(0, 0, 0, .08)",
    }),
    [position],
  );

  return <Panel style={style}>{children}</Panel>;
}
