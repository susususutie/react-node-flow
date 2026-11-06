import BezierEdge from "../Edges/BezierEdge";
import StraightEdge from "../Edges/StraightEdge";
import StepEdge from "../Edges/StepEdge";
import SmoothStepEdge from "../Edges/SmoothStepEdge";
import SimpleBezierEdge from "../Edges/SimpleBezierEdge";
import { type EdgeTypes } from "../../types";

export const builtinEdgeTypes = {
  default: BezierEdge,
  bezier: BezierEdge,
  straight: StraightEdge,
  step: StepEdge,
  smoothstep: SmoothStepEdge,
  simplebezier: SimpleBezierEdge,
} satisfies EdgeTypes;
