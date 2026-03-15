import { Component } from 'react'

export default class MapErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Map rendering error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gray-950 rounded-xl border border-red-900/50">
          <div className="text-center max-w-md px-6">
            <div className="text-4xl mb-4">🌌</div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Map Rendering Error</h3>
            <p className="text-sm text-gray-400 mb-4">
              The aurora map could not be initialized. This may be due to WebGL not being available in your browser, or a graphics driver issue.
            </p>
            <p className="text-xs text-gray-600 font-mono bg-gray-900 rounded p-2 text-left break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-aurora-green text-gray-900 text-sm font-semibold rounded hover:bg-green-400 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
