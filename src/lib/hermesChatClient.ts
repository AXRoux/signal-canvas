import { invoke } from "@tauri-apps/api/core";
import { isWeb } from "./platform";
import { hermesSessionChatWeb } from "./webApi";
import type { CanvasActionPayload } from "./canvasActions";

export interface HermesChatContext {
  investigationSessionId: string;
  caseName: string;
  scanTarget: string;
  selectedNodeId: string | null;
  nodeCount: number;
  edgeCount: number;
  watchlist: string[];
  recentStreamCount: number;
}

export interface HermesChatResponse {
  message: string;
  hermesSessionId: string;
  canvasActions?: CanvasActionPayload | null;
}

export async function hermesSessionChat(
  message: string,
  language: "en" | "pt",
  hermesSessionId: string | null,
  context: HermesChatContext,
): Promise<HermesChatResponse> {
  if (isWeb) {
    return hermesSessionChatWeb(message, language, hermesSessionId, context);
  }
  return invoke<HermesChatResponse>("hermes_session_chat", {
    request: {
      message,
      language,
      hermesSessionId,
      context,
    },
  });
}
