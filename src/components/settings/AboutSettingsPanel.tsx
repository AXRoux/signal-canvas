import { SignalCanvasLogo } from "../icons/SignalCanvasLogo";
import { useI18n } from "../../hooks/useI18n";

export function AboutSettingsPanel() {
  const copy = useI18n();

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl brand-icon-wrap flex items-center justify-center text-[var(--color-text-primary)]">
          <SignalCanvasLogo size={36} />
        </div>
        <div>
          <h3 className="text-base font-display text-[var(--color-text-primary)]">Signal Canvas</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
            {copy.settings.aboutTagline}
          </p>
        </div>
      </div>

      <div className="surface-card p-4 space-y-2">
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{copy.settings.aboutDesc}</p>
        <ul className="text-xs text-[var(--color-text-secondary)] space-y-1.5 list-disc pl-4">
          {copy.settings.aboutFeatures.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed space-y-1">
        <p>{copy.settings.aboutGateway}</p>
        <p className="font-mono">{copy.settings.version}</p>
        <p>{copy.settings.aboutCopyright}</p>
      </div>
    </section>
  );
}
