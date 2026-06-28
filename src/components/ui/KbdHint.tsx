import clsx from "clsx";

interface KbdHintProps {
  keys: string[];
  className?: string;
}

export function KbdHint({ keys, className }: KbdHintProps) {
  return (
    <span className={clsx("sc-kbd-group", className)}>
      {keys.map((key) => (
        <kbd key={key} className="sc-kbd">
          {key}
        </kbd>
      ))}
    </span>
  );
}
