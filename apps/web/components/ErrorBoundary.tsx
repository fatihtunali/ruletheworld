'use client';

import { Component, ReactNode } from 'react';
import { captureReactError } from '../lib/errorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    captureReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Bir hata olustu</h2>
            <p className="text-gray-400 mb-6">
              Beklenmeyen bir hata meydana geldi. Sayfayi yenileyerek tekrar deneyebilirsiniz.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
              >
                Sayfayi Yenile
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                Ana Sayfaya Don
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">Hata Detaylari</summary>
                <pre className="mt-2 p-4 bg-gray-900 rounded-lg text-xs text-red-400 overflow-auto max-h-48">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
