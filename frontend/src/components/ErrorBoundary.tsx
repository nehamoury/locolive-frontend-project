import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children?: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`React Error Boundary caught: ${error.message}`, { errorInfo }, error.stack, 'ErrorBoundary');
    console.error('Uncaught error:', error, errorInfo);
    
    // Check if the error is a dynamic import failure (chunk loading error)
    const isChunkLoadError = 
      error.name === 'ChunkLoadError' || 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Unexpected token') || // when index.html is returned instead of JS
      error.message.includes('Importing a module script failed');

    if (isChunkLoadError) {
      // If we failed to load a chunk, the deployment likely changed.
      // We force a hard reload from the server to get the latest index.html
      const hasReloaded = sessionStorage.getItem('chunk-error-reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk-error-reloaded', 'true');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-4xl font-black text-primary mb-2">Oops!</h1>
          <p className="text-text-muted mb-6">Something went wrong while loading the page.</p>
          
          {this.state.error && (
            <div className="mb-8 p-4 bg-red-500/5 border border-red-500/10 rounded-xl max-w-md w-full text-left overflow-auto">
              <p className="text-red-500 font-bold text-xs uppercase mb-1">{this.state.error.name}</p>
              <p className="text-text-base text-sm font-medium">{this.state.error.message}</p>
            </div>
          )}

          <button 
            onClick={() => {
              sessionStorage.removeItem('chunk-error-reloaded');
              window.location.reload();
            }}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
