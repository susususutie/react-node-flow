import { useContext } from "react";
import DataContext from "../contexts/DataContext";

export default function useData() {
  const value = useContext(DataContext);
  if (!value) {
    throw new Error("useData must be used within a StoreProvider");
  }
  return value;
}
