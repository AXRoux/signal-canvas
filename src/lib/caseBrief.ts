import type { LanguageId } from "../i18n/types";
import type { BriefData, InvestigationSession, RiskReview } from "../store/types";

function caseId(session: InvestigationSession) {
  return `SC-${session.id.slice(0, 8).toUpperCase()}`;
}

function buildRiskReview(session: InvestigationSession, language: LanguageId): RiskReview {
  const tgNodes = session.nodes.filter((n) => n.type === "telegram");
  const signals = new Set<string>();
  for (const n of tgNodes) {
    const tags = (n.data as { signalTags?: string[] }).signalTags ?? [];
    tags.forEach((t) => signals.add(t));
  }
  for (const e of session.monitorStreams.telegram) {
    e.signals.forEach((s) => signals.add(s));
  }
  const indicators = [...signals].slice(0, 8);
  const streamCount = session.monitorStreams.telegram.length;
  const monitored = session.telegram.monitoredChats.map((c) => c.title).join(", ");

  const summaryEn =
    indicators.length > 0
      ? `Human review required. ${tgNodes.length} Telegram signal(s) on graph; ${streamCount} monitored message(s). Lexicon hits: ${indicators.join(", ")}.`
      : `Human review required. Case "${session.title}" has ${streamCount} Telegram observation(s) across ${session.telegram.monitoredChats.length} chat(s). No lexicon hits yet — continue monitoring.`;

  const summaryPt =
    indicators.length > 0
      ? `Revisão humana necessária. ${tgNodes.length} sinal(is) Telegram no grafo; ${streamCount} mensagem(ns) monitorada(s). Indicadores: ${indicators.join(", ")}.`
      : `Revisão humana necessária. Caso "${session.title}" com ${streamCount} observação(ões) Telegram em ${session.telegram.monitoredChats.length} chat(s). Sem indicadores léxicos ainda — continuar monitoramento.`;

  return {
    score: Math.min(95, 35 + indicators.length * 8 + tgNodes.length * 5),
    confidence: indicators.length >= 2 ? "medium" : "low",
    groomingIndicators: indicators,
    escalationTimeline: session.monitorStreams.telegram.slice(0, 5).map((m) => ({
      time: m.observedAt,
      label: m.chatTitle,
      detail: m.text.slice(0, 120),
    })),
    offPlatformNotes: monitored
      ? [`Monitored Telegram: ${monitored}`]
      : ["Configure Telegram monitoring in the Telegram tab."],
    languagesDetected: language === "pt" ? ["pt-BR"] : ["en"],
    summary: language === "pt" ? summaryPt : summaryEn,
  };
}

export function generateCaseBrief(session: InvestigationSession, language: LanguageId): BriefData {
  const generatedAt = new Date().toISOString();
  const tgNodes = session.nodes.filter((n) => n.type === "telegram");
  const senders = [
    ...new Set(
      tgNodes.map((n) => (n.data as { senderName?: string; label?: string }).senderName ?? (n.data as { label?: string }).label).filter(Boolean),
    ),
  ] as string[];
  const chats = session.telegram.monitoredChats.map((c) => c.title);
  const signalSamples = session.monitorStreams.telegram
    .filter((m) => m.signals.length > 0)
    .slice(0, 5)
    .map((m) => `[${m.chatTitle}] ${m.senderName ?? "unknown"}: ${m.text.slice(0, 100)}`);

  const en = language !== "pt";
  const title = en
    ? `Institutional review brief · ${session.title}`
    : `Brief institucional · ${session.title}`;

  return {
    title,
    caseId: caseId(session),
    generatedAt,
    reviewerNotes: en
      ? "Prepared for NGO/CSO human review. Not automated enforcement. Verify all findings with primary sources."
      : "Preparado para revisão humana institucional. Não é aplicação automatizada. Verifique achados nas fontes primárias.",
    sections: [
      {
        title: en ? "Case scope" : "Escopo do caso",
        items: [
          en ? `Case: ${session.title}` : `Caso: ${session.title}`,
          en ? `Monitored chats: ${chats.length ? chats.join("; ") : "none yet"}` : `Chats monitorados: ${chats.length ? chats.join("; ") : "nenhum ainda"}`,
          en ? `Graph nodes: ${session.nodes.length} (${tgNodes.length} Telegram)` : `Nós no grafo: ${session.nodes.length} (${tgNodes.length} Telegram)`,
          en ? `Live stream events: ${session.monitorStreams.telegram.length}` : `Eventos ao vivo: ${session.monitorStreams.telegram.length}`,
        ],
      },
      {
        title: en ? "Observations" : "Observações",
        items:
          signalSamples.length > 0
            ? signalSamples
            : [
                en
                  ? "No flagged lexicon samples yet. Add Telegram messages to the graph or continue monitoring."
                  : "Sem amostras léxicas sinalizadas. Adicione mensagens ao grafo ou continue o monitoramento.",
              ],
      },
      {
        title: en ? "Entities of interest" : "Entidades de interesse",
        items:
          senders.length > 0
            ? senders.slice(0, 8)
            : [en ? "Derive entities by adding stream messages to the graph." : "Derive entidades adicionando mensagens ao grafo."],
      },
      {
        title: en ? "Recommended next steps" : "Próximos passos",
        items: en
          ? [
              "Continue Telegram live monitoring on selected chats.",
              "Connect related senders on the graph (manual edges).",
              "Run Hermes tasks on selected nodes for structured follow-ups.",
              "Escalate via institutional review — do not contact subjects from this console.",
            ]
          : [
              "Continuar monitoramento ao vivo nos chats selecionados.",
              "Conectar remetentes relacionados no grafo (arestas manuais).",
              "Executar tarefas Hermes em nós selecionados.",
              "Escalar via revisão institucional — não contatar sujeitos a partir deste console.",
            ],
      },
    ],
    linkedAccounts: senders,
    keywords: [...new Set(session.monitorStreams.telegram.flatMap((m) => m.signals))].slice(0, 12),
  };
}

export function briefFromSession(session: InvestigationSession, language: LanguageId) {
  return {
    brief: generateCaseBrief(session, language),
    riskReview: buildRiskReview(session, language),
  };
}
