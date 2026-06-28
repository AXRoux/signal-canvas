import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export class ViewErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Signal Canvas]", this.props.label ?? "view", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-surface-muted)]">
          <div className="surface-card max-w-md p-6 text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Something went wrong loading this view
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)] font-mono break-all mb-4">
              {this.state.error.message}
            </p>
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-xs"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
