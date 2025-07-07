
// =====================================================================
// src/components/ErrorBoundary.jsx
// =====================================================================
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h1 className="text-xl font-bold text-red-700">Er is iets misgegaan.</h1>
          <details className="mt-4 text-sm text-red-500">
            <summary>Technische Details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;