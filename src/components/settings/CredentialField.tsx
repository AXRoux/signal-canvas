import { useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";

interface CredentialFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  onChange: (value: string) => void;
  mono?: boolean;
}

export function CredentialField({
  label,
  value,
  placeholder,
  hint,
  onChange,
  mono,
}: CredentialFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block mb-4 last:mb-0">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <div className="relative mt-1.5">
        <input
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            "w-full surface-input px-3 py-2.5 pr-10 text-sm outline-none",
            mono && "font-mono text-xs",
          )}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 leading-relaxed">{hint}</p>}
    </label>
  );
}
