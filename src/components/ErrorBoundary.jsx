import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message || "Unknown error" };
  }

  componentDidCatch() {}

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary-fallback" role="alert">
          <h1>Something went wrong.</h1>
          <p>{this.state.errorMessage}</p>
          <button
            type="button"
            onClick={this.handleReset}
            aria-label="Reset error boundary"
          >
            Try again
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
