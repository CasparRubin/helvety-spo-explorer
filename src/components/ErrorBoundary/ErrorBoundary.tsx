// External dependencies
import * as React from "react";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";

// Utils
import { logError } from "../../utils/errorUtils";

const LOG_SOURCE = "ErrorBoundary";

/**
 * Props for ErrorBoundary component
 */
interface IErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Optional fallback UI to display when an error occurs */
  fallback?: React.ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * State for ErrorBoundary component
 */
interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | undefined;
  errorInfo: React.ErrorInfo | undefined;
}

/**
 * ErrorBoundary component - catches React component errors and displays a fallback UI
 *
 * This component implements React's error boundary pattern to catch JavaScript errors
 * anywhere in the child component tree, log those errors, and display a fallback UI
 * instead of crashing the entire application.
 *
 * @component
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  IErrorBoundaryProps,
  IErrorBoundaryState
> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    };
  }

  /**
   * Update state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<IErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error information when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error
    logError(
      LOG_SOURCE,
      error,
      "React component error caught by ErrorBoundary"
    );

    // Store error info in state for display
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error state (useful for retry functionality)
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          <strong>Something went wrong</strong>
          <p>
            An error occurred while rendering this component. Please try
            refreshing the page.
          </p>
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--sp-color-themePrimary)",
                color: "var(--sp-color-white)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
              aria-label="Retry loading the component"
            >
              Try Again
            </button>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details style={{ marginTop: "10px" }}>
              <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                Error details (development only)
              </summary>
              <pre
                style={{
                  marginTop: "10px",
                  whiteSpace: "pre-wrap",
                  fontSize: "12px",
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </MessageBar>
      );
    }

    return this.props.children;
  }
}
