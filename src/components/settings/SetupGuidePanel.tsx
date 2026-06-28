import { useI18n } from "../../hooks/useI18n";
import { IntegrationSection } from "../integration/IntegrationLayout";

export function SetupGuidePanel() {
  const copy = useI18n();

  const sections = [
    copy.setup.hermes,
    copy.setup.nvidia,
    copy.setup.telegram,
    copy.setup.openai,
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium mb-1">{copy.setup.title}</h3>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{copy.setup.intro}</p>
      </div>

      {sections.map((section) => (
        <IntegrationSection key={section.title} title={section.title} description={section.desc}>
          <ol className="space-y-3">
            {section.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <span className="font-mono text-[10px] text-[var(--stratir-signal)] shrink-0 w-5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {section.link && (
            <a
              href={section.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-[11px] font-mono text-[var(--color-accent)] hover:underline"
            >
              {section.link.label} →
            </a>
          )}
          {section.env && (
            <code className="block mt-3 text-[10px] font-mono p-3 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] whitespace-pre-wrap">
              {section.env}
            </code>
          )}
        </IntegrationSection>
      ))}
    </div>
  );
}
