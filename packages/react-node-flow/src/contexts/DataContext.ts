import { createContext } from "react";
import { type StoreData } from "../types";

export default createContext<StoreData | undefined>(undefined);
