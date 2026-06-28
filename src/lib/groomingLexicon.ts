const PT_BR_SIGNALS: { label: string; patterns: RegExp[] }[] = [
  { label: "Explicit content request", patterns: [/manda foto/i, /send pic/i, /nude/i] },
  { label: "Isolation language", patterns: [/segredo nosso/i, /não conta/i, /just us/i] },
  { label: "Evidence destruction", patterns: [/apaga depois/i, /delete after/i, /clear chat/i] },
  { label: "Off-platform migration", patterns: [/t\.me\//i, /telegram/i, /discord\.gg/i, /chama no priv/i] },
  { label: "Age probing", patterns: [/quantos anos/i, /how old are you/i, /idade/i] },
];

export function detectGroomingSignals(text: string): string[] {
  const hits: string[] = [];
  for (const { label, patterns } of PT_BR_SIGNALS) {
    if (patterns.some((p) => p.test(text))) hits.push(label);
  }
  return hits;
}
