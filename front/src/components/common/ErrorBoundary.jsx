import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI exception caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-cream flex items-center justify-center p-6">
          <div className="bg-white border-4 border-brand-dark rounded-2xl p-8 max-w-lg text-center shadow-pop-lg flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-200 border-2 border-brand-dark flex items-center justify-center text-3xl font-black text-rose-700">
              ⚠️
            </div>
            <h2 className="font-display font-black text-2xl text-brand-dark">
              Something went wrong
            </h2>
            <p className="font-sans text-sm text-slate-600 font-medium leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-2.5 bg-brand-yellow hover:bg-yellow-300 text-brand-dark font-display font-bold text-sm rounded-xl border-2 border-[#0f172a] shadow-pop cursor-pointer transition-all"
            >
              Return to Home Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
