import React from "react";
import ErrorPage from "../../pages/error/ErrorPage";
import { useToast } from "../../context/ToastContext";

/**
 * Determines whether an error is critical (app cannot recover) or
 * non-critical (a single component failed but the shell is fine).
 *
 * Critical errors:
 *  - Chunk / dynamic-import failures (deployment-related)
 *  - Module-resolution errors
 *  - Errors that occur in rapid succession (crash loop)
 */
function isCriticalError(error) {
  if (!error) return true;
  const message = error?.message || String(error);

  // Chunk / dynamic-import failures — the page can't load at all
  if (
    /loading chunk|failed to fetch dynamically imported module|cannot find module|unexpected token/i.test(
      message,
    )
  ) {
    return true;
  }

  // Out of memory / stack overflow — app is fundamentally broken
  if (/maximum call stack|out of memory/i.test(message)) {
    return true;
  }

  // Provider / context errors that break the whole tree
  if (/cannot read properties of null.*useContext/i.test(message)) {
    return true;
  }

  return false;
}

/**
 * Small functional bridge so the class-based ErrorBoundary can trigger toasts
 * through React context without needing hooks directly.
 */
function ToastBridge({ message }) {
  const toast = useToast();
  const shown = React.useRef(false);

  React.useEffect(() => {
    if (message && !shown.current) {
      shown.current = true;
      toast.show(message, "error", 6000);
    }
  }, [message, toast]);

  return null;
}

// Max number of non-critical recoveries within the cooldown window
const MAX_RECOVERIES = 3;
const RECOVERY_COOLDOWN_MS = 5000;

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      // Track recovery attempts to detect crash loops
      recoveryTimestamps: [],
      // Toast message to show after recovery
      toastMessage: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    try {
      console.error("ErrorBoundary caught:", error, errorInfo);
    } catch {
      // ignore logging issues
    }

    const critical = isCriticalError(error);

    if (!critical) {
      // Check for crash loop: too many recoveries in a short window
      const now = Date.now();
      const recent = this.state.recoveryTimestamps.filter(
        (ts) => now - ts < RECOVERY_COOLDOWN_MS,
      );

      if (recent.length >= MAX_RECOVERIES) {
        // Escalate to critical — crash loop detected
        console.error(
          "ErrorBoundary: Crash loop detected, showing error page.",
        );
        return;
      }

      // Non-critical → recover: clear the error and show a toast
      const errorMsg =
        error?.message || String(error) || "An unexpected error occurred";

      // Use a short timeout so React finishes the current error commit
      // before we reset state (avoids React warnings about setState during render)
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          recoveryTimestamps: [...recent, now],
          toastMessage: errorMsg,
        });
      }, 0);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryTimestamps: [],
      toastMessage: null,
    });
    sessionStorage.removeItem("chunk_reload_attempted");
    sessionStorage.removeItem("chunk_error_auto_reload");
    window.location.reload();
  };

  clearToast = () => {
    this.setState({ toastMessage: null });
  };

  render() {
    // Non-critical: recovered, render children + toast bridge
    if (!this.state.hasError) {
      return (
        <>
          {this.state.toastMessage && (
            <ToastBridge message={this.state.toastMessage} />
          )}
          {this.props.children}
        </>
      );
    }

    // Critical: show the full error page
    const isDevOrTest =
      import.meta.env.DEV ||
      import.meta.env.MODE === "development" ||
      import.meta.env.MODE === "test" ||
      (typeof process !== "undefined" &&
        (process.env?.NODE_ENV === "development" ||
          process.env?.NODE_ENV === "test")) ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const errorStack = this.state.error?.stack || "";
    const errorMsg =
      this.state.error?.message ||
      (this.state.error && typeof this.state.error.toString === "function"
        ? this.state.error.toString()
        : "Unknown rendering error");
    const componentStack = this.state.errorInfo?.componentStack || "";

    const errorDetails =
      isDevOrTest && this.state.error
        ? `${errorMsg}${errorStack && !errorStack.includes(errorMsg) ? `\n\nStack:\n${errorStack}` : ""}${componentStack ? `\n\nComponent Stack:\n${componentStack}` : ""}`
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
}

export default ErrorBoundary;
