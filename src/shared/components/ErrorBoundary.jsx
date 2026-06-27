import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-6 flex items-center justify-center">
          <div className="max-w-md bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <h1 className="text-2xl font-bold text-red-700 mb-4">⚠️ Application Error</h1>
            <p className="text-gray-700 mb-4">
              Something went wrong. Please check the browser console for more details.
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4 max-h-48 overflow-auto">
              <p className="text-sm font-mono text-red-800 break-words">
                {this.state.error?.toString()}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              Reload Application
            </button>
            <p className="text-xs text-gray-500 mt-4">
              If the error persists, check the browser console (F12) for more information.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
