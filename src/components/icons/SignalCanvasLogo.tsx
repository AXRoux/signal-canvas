interface LogoProps {
  size?: number;
  className?: string;
}

/** Signal Canvas mark — white tile with dark logo (matches macOS app icon) */
export function SignalCanvasLogo({ size = 24, className }: LogoProps) {
  return (
    <img
      src="/brands/signal-canvas-app-icon.svg"
      alt="Signal Canvas"
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{
        display: "inline-block",
        flexShrink: 0,
        borderRadius: Math.max(4, Math.round(size * 0.2)),
      }}
    />
  );
}
