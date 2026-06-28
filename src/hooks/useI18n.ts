import { useWorkspaceStore } from "../store/workspaceStore";
import { getTranslations } from "../i18n";

export function useI18n() {
  const language = useWorkspaceStore((s) => s.language);
  return getTranslations(language);
}
