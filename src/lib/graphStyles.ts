export type GraphStyleId = "stratir" | "flowsint";

export interface GraphStyleDefinition {
  id: GraphStyleId;
  nameKey: "stratir" | "flowsint";
  descKey: "stratirDesc" | "flowsintDesc";
  inspiration: string;
}

export const GRAPH_STYLES: GraphStyleDefinition[] = [
  {
    id: "stratir",
    nameKey: "stratir",
    descKey: "stratirDesc",
    inspiration: "Industrial review desk — typed nodes, signal edges, agent badges.",
  },
  {
    id: "flowsint",
    nameKey: "flowsint",
    descKey: "flowsintDesc",
    inspiration:
      "Orbit investigation graph — circular typed entities, marquee select, STRATIR edges, Hermes badges.",
  },
];

export function graphStyleClass(id: GraphStyleId): string {
  return `graph-style-${id}`;
}

/** Migrate removed layout ids from older settings. */
export function normalizeGraphStyleId(style?: string): GraphStyleId {
  if (style === "stratir" || style === "flowsint") return style;
  if (style === "chronology" || style === "entity-board") return "flowsint";
  return "flowsint";
}
