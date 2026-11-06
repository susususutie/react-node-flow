import { useContext } from "react";
import ConfigContext from "../contexts/ConfigContext";

export default function useConfig() {
  const value = useContext(ConfigContext);
  if (!value) {
    throw new Error("useConfig must be used within a StoreProvider");
  }
  return value;
}
