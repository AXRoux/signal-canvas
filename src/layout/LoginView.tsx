import { useState, useEffect, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { SignalCanvasLogo } from "../components/icons/SignalCanvasLogo";
import { useAuthStore } from "../store/authStore";
import { useI18n } from "../hooks/useI18n";
import { isWeb } from "../lib/platform";

type RegisterRole = "analyst" | "reviewer";

function PasswordField({
  label,
  value,
  onChange,
  minLength,
  showLabel,
  hideLabel,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  showLabel: string;
  hideLabel: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <div className="auth-password-field mt-1.5">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="auth-password-input surface-input px-3 py-2.5 text-sm outline-none font-mono text-[var(--color-text-primary)]"
          minLength={minLength}
          required={required}
          autoComplete={minLength && minLength >= 8 ? "new-password" : "current-password"}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
        </button>
      </div>
    </label>
  );
}

export function LoginView() {
  const copy = useI18n();
  const login = useAuthStore((s) => s.login);
  const loginRemote = useAuthStore((s) => s.loginRemote);
  const register = useAuthStore((s) => s.register);
  const registerRemote = useAuthStore((s) => s.registerRemote);
  const lastEmail = useAuthStore((s) => s.lastEmail);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [role, setRole] = useState<RegisterRole>("analyst");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lastEmail && !email) setEmail(lastEmail);
  }, [lastEmail, email]);

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setError(null);
    if (next === "login") setConfirmPasscode("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "login") {
      const result = isWeb ? await loginRemote(email, passcode) : await login(email, passcode);
      if (!result.ok) setError(copy.auth.errors.invalid);
      return;
    }
    if (passcode !== confirmPasscode) {
      setError(copy.auth.errors.mismatch);
      return;
    }
    const result = isWeb
      ? await registerRemote(name, email, passcode)
      : await register(name, email, passcode, role);
    if (!result.ok) {
      if (result.error === "exists") setError(copy.auth.errors.exists);
      else setError(copy.auth.errors.validation);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-panel stratir-frame">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 text-[var(--color-text-primary)]">
            <SignalCanvasLogo size={52} />
          </div>
          <h1 className="text-lg font-display text-[var(--color-text-primary)]">{copy.auth.title}</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2 max-w-sm mx-auto leading-relaxed">
            {copy.auth.subtitle}
          </p>
        </div>

        <div className="auth-segment-wrap">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={mode === "login" ? "auth-segment auth-segment-active" : "auth-segment"}
          >
            {copy.auth.signIn}
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={mode === "register" ? "auth-segment auth-segment-active" : "auth-segment"}
          >
            {copy.auth.register}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {copy.auth.nameLabel}
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full surface-input px-3 py-2.5 mt-1.5 text-sm outline-none text-[var(--color-text-primary)]"
                  required
                />
              </label>
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {copy.auth.roleLabel}
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RegisterRole)}
                  className="w-full surface-input px-3 py-2.5 mt-1.5 text-sm outline-none text-[var(--color-text-primary)]"
                >
                  <option value="analyst">{copy.auth.roles.analyst}</option>
                  <option value="reviewer">{copy.auth.roles.reviewer}</option>
                </select>
              </label>
            </>
          )}

          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {copy.auth.emailLabel}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full surface-input px-3 py-2.5 mt-1.5 text-sm outline-none text-[var(--color-text-primary)]"
              required
              autoComplete="email"
            />
          </label>

          <PasswordField
            label={copy.auth.passcodeLabel}
            value={passcode}
            onChange={setPasscode}
            minLength={mode === "register" ? 8 : 1}
            showLabel={copy.auth.showPasscode}
            hideLabel={copy.auth.hidePasscode}
          />

          {mode === "register" && (
            <PasswordField
              label={copy.auth.confirmPasscodeLabel}
              value={confirmPasscode}
              onChange={setConfirmPasscode}
              minLength={8}
              showLabel={copy.auth.showPasscode}
              hideLabel={copy.auth.hidePasscode}
            />
          )}

          {error && <p className="text-xs text-[var(--stratir-impact)]">{error}</p>}

          <button type="submit" className="btn-impact w-full py-2.5 text-sm mt-2">
            {mode === "login" ? copy.auth.signIn : copy.auth.createAccount}
          </button>
        </form>

        <p className="text-[10px] text-center text-[var(--color-text-tertiary)] mt-6 font-mono">
          {isWeb ? copy.auth.accountNote : copy.auth.localNote}
        </p>
      </div>
    </div>
  );
}
