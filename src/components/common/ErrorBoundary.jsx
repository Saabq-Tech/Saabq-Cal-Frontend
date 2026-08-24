import React from 'react';
import ErrorPage from '../../pages/error/ErrorPage';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled React Rendering Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevOrTest =
        import.meta.env.DEV ||
        import.meta.env.MODE === 'development' ||
        import.meta.env.MODE === 'test' ||
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      const errorDetails = (isDevOrTest && this.state.error)
        ? `${this.state.error.toString()}\n${this.state.errorInfo?.componentStack || ''}`
        : null;

      return (
        <ErrorPage
          code="500"
          titleKey="errorBoundaryTitle"
          badgeKey="errorBoundaryBadge"
          descKey="errorBoundaryDesc"
          pageTitleKey="pageTitleServerError"
          iconType="500"
          showDetails={errorDetails}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
