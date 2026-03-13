/**
 * Minimal error boundary for product roots.
 * Catches React errors and shows fallback with Retry.
 */
import React from 'react';
import htm from 'htm';
import { toDisplayString } from '../utils/displayUtils.js';

const html = htm.bind(React.createElement);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return html`
        <div
          role="alert"
          className="p-12 max-w-xl mx-auto text-center rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)]"
        >
          <p className="text-lg font-semibold text-[var(--app-text-primary)]">Something went wrong</p>
          <p className="text-sm text-[var(--app-text-muted)] mt-2">${toDisplayString(this.state.error?.message) || 'An unexpected error occurred.'}</p>
          <button
            onClick=${this.handleRetry}
            className="mt-6 px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90"
          >
            Retry
          </button>
        </div>
      `;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
