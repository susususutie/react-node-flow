import DefaultNode from "../Nodes/DefaultNode";
import InputNode from "../Nodes/InputNode";
import OutputNode from "../Nodes/OutputNode";
import { type NodeTypes } from "../../types";

export const builtinNodeTypes = {
  default: DefaultNode,
  input: InputNode,
  output: OutputNode,
} satisfies NodeTypes;
