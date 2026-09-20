import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-6 bg-[#080B16]/95 border border-[#EF4444]/30 rounded-2xl text-center backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center mb-4 text-[#EF4444]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-mono text-white mb-2">
            SUBSYSTEM ANOMALY DETECTED
          </h3>
          <p className="text-sm text-[#94A3B8] max-w-md mb-6 font-sans">
            {this.props.componentName || 'This component'} encountered a rendering issue. The rest of the portfolio remains fully operational.
          </p>
          {this.state.error && (
            <div className="text-xs font-mono text-[#EF4444]/80 bg-[#10182B] p-3 rounded-lg border border-[#1E293B] mb-6 max-w-lg overflow-x-auto text-left">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#111D3A] border border-[#39DFFF]/40 text-[#39DFFF] hover:bg-[#39DFFF]/10 transition-colors font-mono text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            RELOAD COMPONENT
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
