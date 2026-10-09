import { Component } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

// Catches any render crash (e.g. a stray record left over from an older build) so a presenter
// never lands on a blank white page — shows a recoverable screen instead. There is no backend
// here, so "reset" just clears this browser's local demo data, which is the actual failure mode
// this most commonly guards against.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('MarketDeal crashed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash-screen">
        <div className="crash-card">
          <div className="gate-icon crash-icon"><AlertTriangle size={30} /></div>
          <h1>Something went wrong</h1>
          <p className="muted">
            This screen hit an unexpected error — often caused by demo data left over from an earlier
            version of the prototype. Reloading usually fixes it; if not, reset the local demo data.
          </p>
          <div className="gate-actions">
            <button className="btn btn-primary btn-lg" onClick={() => window.location.reload()}>
              <RotateCcw size={16} /> Reload
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => {
                window.localStorage.clear();
                window.location.href = '/';
              }}
            >
              <Trash2 size={16} /> Reset demo data & reload
            </button>
          </div>
          <details className="crash-details">
            <summary>Technical details</summary>
            <pre>{String(this.state.error?.stack || this.state.error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}
