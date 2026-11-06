import { useContext } from "react";
import ReactiveContext from "../contexts/ReactiveContext";

export default function useReactive() {
  const value = useContext(ReactiveContext);
  if (!value) {
    throw new Error("useReactive must be used within a StoreProvider");
  }
  return value;
}
