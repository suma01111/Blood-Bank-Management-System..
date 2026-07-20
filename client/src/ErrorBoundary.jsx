import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, details) { console.error('Page rendering failed', error, details); }

  render() {
    if (this.state.error) return <div className="container py-5"><div className="card shadow"><div className="card-body p-5 text-center"><i className="fas fa-triangle-exclamation fa-3x text-primary mb-3" /><h2>We couldn’t display this page</h2><p className="text-muted">Refresh the page or return to the dashboard. Your data has not been changed.</p><a className="btn btn-primary" href="/dashboard">Return to Dashboard</a></div></div></div>;
    return this.props.children;
  }
}
