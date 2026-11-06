let injected = false;

function ensureAnimationStyle() {
  if (injected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes dashdraw {
      from { stroke-dashoffset: 10; }
      to { stroke-dashoffset: 0; }
    }
  `;
  document.head.appendChild(style);
  injected = true;
}

interface BaseEdgeProps {
  path: string;
  interactionWidth?: number;
  style?: React.CSSProperties;
  className?: string;
  markerEnd?: string;
  markerStart?: string;
  animated?: boolean;
}

export default function BaseEdge({
  path,
  interactionWidth = 20,
  style,
  className,
  markerEnd,
  markerStart,
  animated,
}: BaseEdgeProps) {
  if (animated) {
    ensureAnimationStyle();
  }

  const pathStyle: React.CSSProperties = animated
    ? {
        ...style,
        strokeDasharray: 5,
        animation: "dashdraw 0.5s linear infinite",
      }
    : (style ?? {});

  return (
    <>
      <path
        d={path}
        fill="none"
        className={className}
        style={pathStyle}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {interactionWidth > 0 && (
        <path
          d={path}
          fill="none"
          strokeOpacity={0}
          strokeWidth={interactionWidth}
          style={{ pointerEvents: "stroke" }}
        />
      )}
    </>
  );
}
