import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fef2f2', padding: '32px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h2 style={{ color: '#dc2626', fontWeight: '700', marginBottom: '12px' }}>Something went wrong</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>{this.state.error?.message}</p>
                    <button onClick={() => this.setState({ hasError: false, error: null })}
                        style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' }}>
                        Try Again
                    </button>
                    <button onClick={() => window.location.reload()}
                        style={{ background: 'white', color: '#374151', border: '1px solid #e5e7eb', padding: '10px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                        Reload
                    </button>
                </div>
            </div>
        );
    }
}