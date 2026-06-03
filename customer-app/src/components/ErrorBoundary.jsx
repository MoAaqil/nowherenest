import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: '#FFF1F2',
          border: '1.5px solid #FECDD3',
          borderRadius: '16px',
          margin: '20px auto',
          maxWidth: '600px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: '#9F1239', margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>
            Something went wrong rendering this section
          </h3>
          <p style={{ color: '#E11D48', fontSize: '13px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
            Error: {this.state.error?.message || 'Unknown render error'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              padding: '10px 20px',
              background: '#E11D48',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'background 0.2s'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
