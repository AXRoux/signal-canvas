import { createContext, useContext } from "react";
import type { GraphStyleId } from "../lib/graphStyles";

export const GraphStyleContext = createContext<GraphStyleId>("stratir");

export function useGraphStyle() {
  return useContext(GraphStyleContext);
}
