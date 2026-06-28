interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** Official Hermes Agent mark — uses mask + currentColor for all themes */
export function HermesIcon({ size = 16, className }: BrandMarkProps) {
  return (
    <span
      role="img"
      aria-label="Hermes Agent"
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-block",
        flexShrink: 0,
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/brands/hermes-agent.svg)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: "url(/brands/hermes-agent.svg)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
