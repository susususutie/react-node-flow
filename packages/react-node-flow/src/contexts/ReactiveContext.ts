import { createContext } from "react";
import { type StoreReactive } from "../types";

export default createContext<StoreReactive | undefined>(undefined);
