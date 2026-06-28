interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** Official Telegram mark — colored PNG from public/brands */
export function TelegramIcon({ size = 16, className }: BrandMarkProps) {
  return (
    <img
      src="/brands/telegram.png"
      alt="Telegram"
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", flexShrink: 0, objectFit: "contain" }}
    />
  );
}
