import { en } from "./en";
import { pt } from "./pt";
import type { LanguageId, Translations } from "./types";

export type { LanguageId, Translations };

const catalog: Record<LanguageId, Translations> = { en, pt };

export function getTranslations(language: LanguageId): Translations {
  return catalog[language];
}

export function t(
  language: LanguageId,
  key: string,
  vars?: Record<string, string>,
): string {
  const parts = key.split(".");
  let value: unknown = catalog[language];
  for (const part of parts) {
    value = (value as Record<string, unknown>)?.[part];
  }
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(`{${k}}`, v),
    value,
  );
}

export { en, pt };
