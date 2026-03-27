import type { KnownProjectCode } from "@/features/imports/types";

export type NormalizedProject = {
  projectCode: KnownProjectCode;
  projectName: string;
  rawValue: string;
};

type ProjectDefinition = {
  aliases: string[];
  projectCode: KnownProjectCode;
  projectName: string;
};

const PROJECT_DEFINITIONS: ProjectDefinition[] = [
  {
    aliases: ["il parco", "parco", "el parco", "al parco", "ال باركو", "إل باركو", "باركو"],
    projectCode: "parco",
    projectName: "IL Parco",
  },
  {
    aliases: [
      "il centro",
      "centro",
      "el centro",
      "al centro",
      "ال سنترو",
      "إل سنترو",
      "سنترو",
    ],
    projectCode: "centro",
    projectName: "IL Centro",
  },
  {
    aliases: ["caza", "كازا"],
    projectCode: "caza",
    projectName: "Caza",
  },
];

const PROJECT_ALIAS_LOOKUP = new Map(
  PROJECT_DEFINITIONS.flatMap((definition) =>
    definition.aliases.map((alias) => [normalizeProjectLookupValue(alias), definition] as const),
  ),
);

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function coerceText(value: unknown): string | null {
  if (typeof value === "string") {
    const text = collapseWhitespace(value);

    return text.length > 0 ? text : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

export function normalizeProjectLookupValue(value: string): string {
  return collapseWhitespace(
    collapseWhitespace(value)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\-_]+/g, " "),
  );
}

export function normalizeProject(value: unknown): NormalizedProject | null {
  const rawValue = coerceText(value);

  if (!rawValue) {
    return null;
  }

  const definition = PROJECT_ALIAS_LOOKUP.get(normalizeProjectLookupValue(rawValue));

  if (!definition) {
    return null;
  }

  return {
    projectCode: definition.projectCode,
    projectName: definition.projectName,
    rawValue,
  };
}

export function stripKnownProjectPrefix(value: string): { projectCode?: KnownProjectCode; value: string } {
  const trimmedValue = collapseWhitespace(value);

  for (const definition of PROJECT_DEFINITIONS) {
    for (const alias of definition.aliases) {
      const pattern = new RegExp(`^${escapeRegExp(alias).replace(/\\ /g, "\\s+")}\\s*[-–—]\\s*(.+)$`, "i");
      const match = trimmedValue.match(pattern);

      if (match?.[1]) {
        return {
          projectCode: definition.projectCode,
          value: collapseWhitespace(match[1]),
        };
      }
    }
  }

  return { value: trimmedValue };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
