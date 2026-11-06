import useConfig from "../hooks/useConfig";
import useReactive from "../hooks/useReactive";

const BACKGROUND_VARIANT = {
  Lines: "lines",
  Dots: "dots",
  Cross: "cross",
} as const;

type BackgroundVariant = (typeof BACKGROUND_VARIANT)[keyof typeof BACKGROUND_VARIANT];

type BackgroundProps = {
  id?: string;
  color?: string;
  bgColor?: string;
  gap?: number | [number, number];
  size?: number;
  offset?: number | [number, number];
  lineWidth?: number;
  variant?: BackgroundVariant;
};

const defaultSize = {
  [BACKGROUND_VARIANT.Dots]: 1,
  [BACKGROUND_VARIANT.Lines]: 1,
  [BACKGROUND_VARIANT.Cross]: 6,
};

const defaultColor = {
  [BACKGROUND_VARIANT.Dots]: "#91919a",
  [BACKGROUND_VARIANT.Lines]: "#eee",
  [BACKGROUND_VARIANT.Cross]: "#e2e2e2",
};

export default function Background(props: BackgroundProps) {
  const {
    id,
    color: _color,
    bgColor = "transparent",
    // only used for dots and cross
    gap = 20,
    variant = BACKGROUND_VARIANT.Dots,
    // only used for dots and cross
    size,
    offset = 0,
    // only used for lines and cross
    lineWidth = 1,
  } = props;
  const { nfId } = useConfig();
  const { transform } = useReactive();
  const [x, y, zoom] = transform;

  const patternId = `pattern-${id || nfId}`;
  const patternSize = size || defaultSize[variant];
  const isDots = variant === BACKGROUND_VARIANT.Dots;
  const isCross = variant === BACKGROUND_VARIANT.Cross;
  const gapXY: [number, number] = Array.isArray(gap) ? gap : [gap, gap];
  const scaledGap: [number, number] = [gapXY[0] * zoom || 1, gapXY[1] * zoom || 1];
  const scaledSize = patternSize * zoom;
  const offsetXY: [number, number] = Array.isArray(offset) ? offset : [offset, offset];

  const patternDimensions: [number, number] = isCross ? [scaledSize, scaledSize] : scaledGap;
  const scaledOffset: [number, number] = [
    offsetXY[0] * zoom || 1 + patternDimensions[0] / 2,
    offsetXY[1] * zoom || 1 + patternDimensions[1] / 2,
  ];
  const color = _color || defaultColor[variant];

  return (
    <svg
      className="node-flow__background"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        zIndex: -1,
        backgroundColor: bgColor,
        pointerEvents: "none",
      }}
    >
      <pattern
        id={patternId}
        x={x % scaledGap[0]}
        y={y % scaledGap[1]}
        width={scaledGap[0]}
        height={scaledGap[1]}
        patternUnits="userSpaceOnUse"
        patternTransform={`translate(-${scaledOffset[0]},-${scaledOffset[1]})`}
      >
        {isDots ? (
          <circle cx={scaledSize / 2} cy={scaledSize / 2} r={scaledSize / 2} fill={color} />
        ) : (
          <path
            strokeWidth={lineWidth}
            d={`M${patternDimensions[0] / 2} 0 V${patternDimensions[1]} M0 ${patternDimensions[1] / 2} H${patternDimensions[0]}`}
            stroke={color}
          />
        )}
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
