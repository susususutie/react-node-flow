import { useContext } from "react";
import DispatchContext from "../contexts/DispatchContext";

export default function useDispatch() {
  const value = useContext(DispatchContext);
  if (!value) {
    throw new Error("useDispatch must be used within a DispatchContext.Provider");
  }
  return value;
}
