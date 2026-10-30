import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error trapped by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-line bg-surface p-6 shadow-xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-risk-critical/10 text-risk-critical">
              <AlertTriangleIcon className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
              <p className="mt-1 text-xs text-muted">
                An unexpected error occurred while rendering this view. Your session data has been preserved.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-lg bg-surface-2 p-3 text-left">
                <p className="font-mono text-xs text-risk-critical-ink break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy/90 transition-colors"
              >
                <RefreshCwIcon className="h-3.5 w-3.5" />
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-2 transition-colors"
              >
                <HomeIcon className="h-3.5 w-3.5" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
