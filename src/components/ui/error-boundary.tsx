'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">Something went wrong</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => this.setState({ hasError: false, error: null })}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
