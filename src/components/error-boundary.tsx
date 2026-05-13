"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  variant?: "global" | "bake";
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isBake = this.props.variant === "bake";

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div
              className="text-4xl mb-4"
              role="img"
              aria-label={isBake ? "bread" : "warning"}
            >
              {isBake ? "\u{1F35E}" : "⚠️"}
            </div>
            <h2
              className="font-[family-name:var(--font-playfair)] text-xl font-semibold mb-2"
              style={{ color: "var(--text)" }}
            >
              {isBake ? "Your bake data is saved" : "Something went wrong"}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              {isBake
                ? "Something went wrong, but your progress is safe in local storage. Tap below to pick up where you left off."
                : "An unexpected error occurred. Try refreshing the page."}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (!isBake) window.location.href = "/";
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: "var(--accent)",
                color: "var(--bg)",
              }}
            >
              {isBake ? "Resume Bake" : "Go Home"}
            </button>
            {this.state.error && (
              <p
                className="text-[10px] mt-4 font-mono break-all"
                style={{ color: "var(--text-ghost)" }}
              >
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
