import type { BuiltinMarkerType } from "../../types";

export const MARKER_DEFAULTS = {
  arrowclosed: { width: 12, height: 12, color: "#9ca3af" },
  arrow: { width: 12, height: 12, color: "#9ca3af" },
  circle: { width: 6, height: 6, color: "#9ca3af" },
  diamond: { width: 12, height: 12, color: "#9ca3af" },
} as const;

export function toMarkerId(
  type: BuiltinMarkerType,
  color: string,
  width: number,
  height: number,
): string {
  return `marker-${type}-${color}-${width}-${height}`.replace(/[^a-zA-Z0-9#-]/g, "_");
}

export function renderMarkerDef(
  type: BuiltinMarkerType,
  color: string,
  width: number,
  height: number,
) {
  const id = toMarkerId(type, color, width, height);
  switch (type) {
    case "arrowclosed":
      return (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth={width}
          markerHeight={height}
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      );
    case "arrow":
      return (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="11"
          refY="5"
          markerWidth={width}
          markerHeight={height}
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke={color} strokeWidth="1" />
        </marker>
      );
    case "circle":
      return (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth={width}
          markerHeight={height}
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <circle cx="5" cy="5" r="5" fill={color} />
        </marker>
      );
    case "diamond":
      return (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth={width}
          markerHeight={height}
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 5 0 L 10 5 L 5 10 L 0 5 z" fill={color} />
        </marker>
      );
  }
}

export function resolveMarkerUrl(marker: {
  type: BuiltinMarkerType;
  color?: string;
  width?: number;
  height?: number;
}): string {
  const defaults = MARKER_DEFAULTS[marker.type];
  const color = marker.color ?? defaults.color;
  const width = marker.width ?? defaults.width;
  const height = marker.height ?? defaults.height;
  return `url(#${toMarkerId(marker.type, color, width, height)})`;
}
