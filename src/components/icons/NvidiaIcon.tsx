interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** Official NVIDIA Nemotron mark — brand green preserved across themes */
export function NvidiaIcon({ size = 16, className }: BrandMarkProps) {
  return (
    <span
      role="img"
      aria-label="NVIDIA"
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-block",
        flexShrink: 0,
        backgroundColor: "var(--brand-nvidia)",
        WebkitMaskImage: "url(/brands/nvidia-color.svg)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: "url(/brands/nvidia-color.svg)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
