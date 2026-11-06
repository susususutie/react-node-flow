import { createContext } from "react";
import { type StoreAction } from "../types";

export default createContext<React.Dispatch<StoreAction> | undefined>(undefined);
