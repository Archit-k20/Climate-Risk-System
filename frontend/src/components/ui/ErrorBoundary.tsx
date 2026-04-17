import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  // Optional custom fallback — if not provided, we use our default
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary must be a class component — this is a React requirement
 * because the error lifecycle methods (componentDidCatch, getDerivedStateFromError)
 * are only available on class components, not function components or hooks.
 * 
 * This is one of the few remaining valid use cases for class components in
 * modern React. Everything else in our app uses function components.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  // getDerivedStateFromError is called when a child throws an error.
  // It returns new state that causes the next render to show the fallback UI.
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  // componentDidCatch is where you'd send the error to a logging service
  // like Sentry in production. For now we just log to the console.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback was provided, use it
      if (this.props.fallback) return this.props.fallback

      // Otherwise use our default error UI
      return (
        <div
          className="rounded-xl p-8 flex flex-col items-center justify-center text-center"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid rgba(239,68,68,0.3)',
            minHeight: '200px',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(239,68,68,0.15)' }}
          >
            <AlertTriangle size={22} style={{ color: 'var(--color-red)' }} />
          </div>

          <h3
            className="text-base font-semibold mb-2"
            style={{ fontFamily: 'Syne, sans-serif', color: 'hsl(var(--foreground))' }}
          >
            Something went wrong
          </h3>

          <p
            className="text-xs mb-4 max-w-xs"
            style={{ color: 'var(--color-muted)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: '1.6' }}
          >
            This section encountered an unexpected error. The rest of the
            dashboard is unaffected.
          </p>

          {/* Show the error message in development so developers can debug */}
          {import.meta.env.DEV && this.state.error && (
            <p
              className="text-xs mb-4 px-3 py-2 rounded-lg max-w-sm text-left"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: 'var(--color-red)',
                fontFamily: 'IBM Plex Mono, monospace',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </p>
          )}

          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-colors hover:bg-white/10"
            style={{
              border: '1px solid var(--color-border)',
              color: 'hsl(var(--foreground))',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}