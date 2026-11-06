import { createContext } from "react";
import { type StoreConfig } from "../types";

export default createContext<StoreConfig | undefined>(undefined);
