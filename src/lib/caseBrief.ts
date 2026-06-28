import type { LanguageId } from "../i18n/types";
import { detectGroomingSignals } from "./groomingLexicon";
import type { BriefData, InvestigationSession, RiskReview, StreamEvent } from "../store/types";

const NOISE_PATTERNS = [
  /login code/i,
  /web login code/i,
  /do not give this code/i,
  /my\.telegram\.org/i,
  /two-step verification/i,
  /telegram code/i,
  /this code can be used to log in/i,
  /dear .+, we received a request/i,
];

function formatBriefDate(iso: string, language: LanguageId): string {
  return new Date(iso).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isOperationalNoise(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function normalizeIndicatorLabel(label: string): string | null {
  const normalized = label.trim().replace(/\s+/g, " ");
  if (!normalized || /^off-platform migration$/i.test(normalized)) return null;
  return normalized;
}

function eventIndicatorLabels(event: StreamEvent): string[] {
  return [
    ...new Set(
      [...event.signals, ...detectGroomingSignals(event.text)]
        .map(normalizeIndicatorLabel)
        .filter((label): label is string => Boolean(label)),
    ),
  ];
}

function briefWorthyEvents(session: InvestigationSession): StreamEvent[] {
  return session.monitorStreams.telegram.filter((event) => {
    if (isOperationalNoise(event.text)) return false;
    return eventIndicatorLabels(event).length > 0;
  });
}

function graphTelegramNodes(session: InvestigationSession) {
  return session.nodes.filter((n) => n.type === "telegram");
}

function graphIndicatorNodeCount(session: InvestigationSession): number {
  return graphTelegramNodes(session).filter((node) =>
    ((node.data as { signalTags?: string[] }).signalTags ?? []).some(
      (tag) => normalizeIndicatorLabel(tag) !== null,
    ),
  ).length;
}

function senderLabel(node: InvestigationSession["nodes"][number]): string | null {
  const data = node.data as {
    senderName?: string;
    label?: string;
    chatTitle?: string;
    snippet?: string;
  };
  const name = data.senderName?.trim() || data.label?.trim();
  if (!name || name.length < 2) return null;
  if (/^r\*$/i.test(name)) return null;
  if (isOperationalNoise(name)) return null;
  return name;
}

function chatLabels(session: InvestigationSession): string[] {
  const fromMonitor = session.telegram.monitoredChats
    .map((c) => c.title?.trim())
    .filter((title): title is string => !!title && title.toLowerCase() !== "null");
  const fromGraph = graphTelegramNodes(session)
    .map((n) => (n.data as { chatTitle?: string }).chatTitle?.trim())
    .filter((title): title is string => !!title && title.toLowerCase() !== "null");
  return [...new Set([...fromMonitor, ...fromGraph])];
}

function indicatorLabels(session: InvestigationSession): string[] {
  const labels = new Set<string>();
  for (const event of briefWorthyEvents(session)) {
    for (const label of eventIndicatorLabels(event)) labels.add(label);
  }
  for (const node of graphTelegramNodes(session)) {
    const tags = (node.data as { signalTags?: string[] }).signalTags ?? [];
    for (const tag of tags) {
      const normalized = normalizeIndicatorLabel(tag);
      if (normalized) labels.add(normalized);
    }
  }
  return [...labels].slice(0, 8);
}

function evidenceHighlights(session: InvestigationSession, language: LanguageId, limit = 4): string[] {
  const en = language !== "pt";
  return briefWorthyEvents(session)
    .slice(0, limit)
    .map((event) => {
      const chat = event.chatTitle?.trim() || (en ? "Monitored channel" : "Canal monitorado");
      const sender = event.senderName?.trim() || (en ? "Unknown sender" : "Remetente desconhecido");
      const excerpt = event.text.replace(/\s+/g, " ").trim().slice(0, 140);
      const indicators = eventIndicatorLabels(event).slice(0, 3).join(", ");
      return indicators
        ? `${chat} · ${sender}: “${excerpt}” (${indicators})`
        : `${chat} · ${sender}: “${excerpt}”`;
    });
}

function buildRiskReview(session: InvestigationSession, language: LanguageId): RiskReview {
  const graphSignalCount = graphIndicatorNodeCount(session);
  const indicators = indicatorLabels(session);
  const worthy = briefWorthyEvents(session);
  const streamCount = worthy.length;

  const summaryEn =
    indicators.length > 0
      ? streamCount > 0
        ? `Analyst review recommended. ${indicators.length} indicator type(s) observed across ${streamCount} substantive message(s) and ${graphSignalCount} mapped signal(s).`
        : `Analyst review recommended. ${indicators.length} indicator type(s) observed in ${graphSignalCount} mapped graph signal(s).`
      : streamCount > 0
        ? `Analyst review recommended. ${streamCount} substantive monitored message(s) require human assessment before any external action.`
        : `Monitoring in progress. No substantive indicator samples are ready for external briefing yet.`;

  const summaryPt =
    indicators.length > 0
      ? streamCount > 0
        ? `Revisão analítica recomendada. ${indicators.length} tipo(s) de indicador observados em ${streamCount} mensagem(ns) substantiva(s) e ${graphSignalCount} sinal(is) mapeados.`
        : `Revisão analítica recomendada. ${indicators.length} tipo(s) de indicador observados em ${graphSignalCount} sinal(is) mapeados no grafo.`
      : streamCount > 0
        ? `Revisão analítica recomendada. ${streamCount} mensagem(ns) monitorada(s) substantiva(s) requerem avaliação humana antes de qualquer ação externa.`
        : `Monitoramento em andamento. Ainda não há amostras substantivas prontas para brief externo.`;

  const hasEvidence = indicators.length > 0 || streamCount > 0;

  return {
    score: hasEvidence
      ? Math.min(92, 28 + indicators.length * 10 + Math.min(graphSignalCount, 6) * 4)
      : 0,
    confidence: indicators.length >= 2 ? "medium" : indicators.length === 1 ? "low" : "low",
    groomingIndicators: indicators,
    escalationTimeline: worthy.slice(0, 5).map((event) => ({
      time: event.observedAt,
      label: event.chatTitle?.trim() || "Telegram",
      detail: event.text.replace(/\s+/g, " ").trim().slice(0, 120),
    })),
    offPlatformNotes: [],
    languagesDetected: language === "pt" ? ["pt-BR"] : ["en"],
    summary: language === "pt" ? summaryPt : summaryEn,
  };
}

export function generateCaseBrief(session: InvestigationSession, language: LanguageId): BriefData {
  const generatedAt = new Date().toISOString();
  const en = language !== "pt";
  const caseName = session.caseName?.trim() || session.title.trim();
  const chats = chatLabels(session);
  const senders = [
    ...new Set(graphTelegramNodes(session).map(senderLabel).filter(Boolean)),
  ] as string[];
  const indicators = indicatorLabels(session);
  const highlights = evidenceHighlights(session, language);
  const worthyCount = briefWorthyEvents(session).length;

  const graphCount = graphIndicatorNodeCount(session);

  const executiveSummaryEn =
    indicators.length > 0
      ? worthyCount > 0
        ? `This memorandum summarizes human-reviewed digital protection findings for “${caseName}”. Analysts identified ${indicators.length} concern category(ies) across ${worthyCount} flagged communication(s)${chats.length ? ` in monitored channel(s) including ${chats.slice(0, 2).join(" and ")}` : ""}. Findings are preliminary and intended for institutional review only.`
        : `This memorandum summarizes human-reviewed digital protection findings for “${caseName}”. Analysts identified ${indicators.length} concern category(ies) from ${graphCount} mapped graph signal(s)${chats.length ? ` in monitored channel(s) including ${chats.slice(0, 2).join(" and ")}` : ""}. Findings are preliminary and intended for institutional review only.`
      : worthyCount > 0
        ? `This memorandum summarizes monitoring activity for “${caseName}”. ${worthyCount} communication(s) have been flagged for analyst review${chats.length ? ` across ${chats.length} monitored channel(s)` : ""}. No formal escalation is implied without human verification.`
        : `This memorandum documents the opening review scope for “${caseName}”. Monitoring is active${chats.length ? ` across ${chats.length} channel(s)` : ""}; substantive findings suitable for external sharing are not yet confirmed.`;

  const executiveSummaryPt =
    indicators.length > 0
      ? worthyCount > 0
        ? `Este memorando resume achados de proteção digital revisados por analistas para “${caseName}”. Foram identificadas ${indicators.length} categoria(s) de preocupação em ${worthyCount} comunicação(ões) sinalizada(s)${chats.length ? ` em canais monitorados incluindo ${chats.slice(0, 2).join(" e ")}` : ""}. Os achados são preliminares e destinados apenas à revisão institucional.`
        : `Este memorando resume achados de proteção digital revisados por analistas para “${caseName}”. Foram identificadas ${indicators.length} categoria(s) de preocupação a partir de ${graphCount} sinal(is) mapeados no grafo${chats.length ? ` em canais monitorados incluindo ${chats.slice(0, 2).join(" e ")}` : ""}. Os achados são preliminares e destinados apenas à revisão institucional.`
      : worthyCount > 0
        ? `Este memorando resume a atividade de monitoramento de “${caseName}”. ${worthyCount} comunicação(ões) foram sinalizadas para revisão analítica${chats.length ? ` em ${chats.length} canal(is) monitorado(s)` : ""}. Nenhuma escalada formal é implícita sem verificação humana.`
        : `Este memorando documenta o escopo inicial de revisão de “${caseName}”. O monitoramento está ativo${chats.length ? ` em ${chats.length} canal(is)` : ""}; achados substantivos prontos para compartilhamento externo ainda não foram confirmados.`;

  return {
    title: en
      ? `Investigation memorandum · ${caseName}`
      : `Memorando de investigação · ${caseName}`,
    reference: en
      ? `${caseName} · ${formatBriefDate(generatedAt, language)}`
      : `${caseName} · ${formatBriefDate(generatedAt, language)}`,
    caseId: caseName.replace(/[^\w.-]+/g, "-").slice(0, 48) || "case",
    generatedAt,
    generatedAtDisplay: formatBriefDate(generatedAt, language),
    executiveSummary: en ? executiveSummaryEn : executiveSummaryPt,
    reviewerNotes: en
      ? "Prepared for institutional review by trained analysts. This document does not constitute legal advice, automated enforcement, or permission to contact subjects. Verify all findings against primary sources before external distribution."
      : "Preparado para revisão institucional por analistas qualificados. Este documento não constitui assessoria jurídica, aplicação automatizada ou autorização para contatar sujeitos. Verifique todos os achados nas fontes primárias antes da distribuição externa.",
    sections: [
      {
        title: en ? "Scope of review" : "Escopo da revisão",
        items: [
          en
            ? `Subject case: ${caseName}`
            : `Caso: ${caseName}`,
          chats.length
            ? en
              ? `Channels under monitoring: ${chats.join(", ")}`
              : `Canais monitorados: ${chats.join(", ")}`
            : en
              ? "Channels under monitoring: pending analyst configuration"
              : "Canais monitorados: pendente configuração analítica",
          en
            ? `Mapped signals on review graph: ${graphTelegramNodes(session).length}`
            : `Sinais mapeados no grafo de revisão: ${graphTelegramNodes(session).length}`,
        ],
      },
      {
        title: en ? "Key findings" : "Principais achados",
        items:
          highlights.length > 0
            ? highlights
            : [
                en
                  ? "No substantive flagged communications are available for external briefing at this time. Continue monitoring and map relevant messages to the review graph."
                  : "Não há comunicações substantivas sinalizadas disponíveis para brief externo neste momento. Continue o monitoramento e mapeie mensagens relevantes no grafo de revisão.",
              ],
      },
      {
        title: en ? "Parties of interest" : "Partes de interesse",
        items:
          senders.length > 0
            ? senders.slice(0, 6).map((sender) => (en ? `Observed actor: ${sender}` : `Ator observado: ${sender}`))
            : [
                en
                  ? "No verified actors have been designated for external disclosure yet."
                  : "Nenhum ator verificado foi designado para divulgação externa ainda.",
              ],
      },
      {
        title: en ? "Recommended actions" : "Ações recomendadas",
        items: en
          ? [
              "Complete human review of flagged communications against primary sources.",
              "Document chain-of-custody for any evidence selected for referral.",
              "Coordinate escalation through institutional partners — do not contact subjects from this console.",
              "Update this memorandum after additional monitoring or graph correlation.",
            ]
          : [
              "Concluir revisão humana das comunicações sinalizadas com fontes primárias.",
              "Documentar cadeia de custódia de evidências selecionadas para encaminhamento.",
              "Coordenar escalada via parceiros institucionais — não contatar sujeitos a partir deste console.",
              "Atualizar este memorando após monitoramento adicional ou correlação no grafo.",
            ],
      },
    ],
    linkedAccounts: senders,
    keywords: indicators,
  };
}

export function briefFromSession(session: InvestigationSession, language: LanguageId) {
  return {
    brief: generateCaseBrief(session, language),
    riskReview: buildRiskReview(session, language),
  };
}
