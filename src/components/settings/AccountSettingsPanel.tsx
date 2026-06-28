import { LogOut, Shield } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useI18n } from "../../hooks/useI18n";

export function AccountSettingsPanel() {
  const copy = useI18n();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] flex items-center justify-center">
          <Shield size={18} className="text-[var(--color-accent)]" />
        </div>
        <div>
          <h3 className="text-sm font-medium">{user.name}</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">{user.email}</p>
        </div>
      </div>

      <div className="surface-card p-4 stratir-frame">
        <dl className="space-y-3 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="font-mono uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {copy.auth.roleLabel}
            </dt>
            <dd className="text-[var(--color-text-primary)] capitalize">{copy.auth.roles[user.role]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-mono uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {copy.auth.operatorId}
            </dt>
            <dd className="font-mono text-[10px] text-[var(--color-text-secondary)] truncate max-w-[180px]">
              {user.id}
            </dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={logout}
        className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-xs"
      >
        <LogOut size={14} />
        {copy.auth.signOut}
      </button>

      <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">{copy.auth.accountNote}</p>
    </div>
  );
}
