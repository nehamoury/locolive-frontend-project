import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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
          <h1 className="text-4xl font-black text-primary mb-4">Oops!</h1>
          <p className="text-text-muted mb-8">Something went wrong while loading the page.</p>
          <button 
            onClick={() => {
              sessionStorage.removeItem('chunk-error-reloaded');
              window.location.reload();
            }}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
