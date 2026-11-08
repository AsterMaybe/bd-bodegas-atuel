import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex-center p-4">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md text-center">
            <svg className="mx-auto h-12 w-12 text-error mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-text mb-2">Algo salió mal</h2>
            <p className="text-text-muted mb-4">Hubo un error al cargar la aplicación.</p>
            {this.state.error && (
              <details className="text-left text-xs bg-neutral-100 p-3 rounded mb-4 text-text-muted">
                <summary className="cursor-pointer font-medium">Detalles del error</summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
