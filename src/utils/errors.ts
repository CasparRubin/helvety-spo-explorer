import { ErrorCategory } from './errorUtils';

/**
 * Interface for V8 Error constructor with captureStackTrace support
 * 
 * This interface extends the Error constructor to include the captureStackTrace
 * method available in V8 engines (Node.js, Chrome). This method allows capturing
 * a custom stack trace for better error debugging.
 * 
 * @interface IErrorConstructorWithCaptureStackTrace
 * @property captureStackTrace - Optional method to capture a custom stack trace.
 *   When called, it captures the stack trace at the point where the constructor
 *   is called, excluding frames above the constructor in the stack.
 *   @param error - The Error instance to attach the stack trace to
 *   @param constructor - The constructor function to use as the boundary for the stack trace
 */
interface IErrorConstructorWithCaptureStackTrace {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  captureStackTrace?: (error: Error, constructor: Function) => void;
}

/**
 * Base custom error class for application-specific errors
 * 
 * Extends the native Error class to provide additional context and categorization
 * for better error handling throughout the application.
 */
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly originalError?: unknown;
  public readonly context?: string;

  /**
   * Creates a new AppError instance
   * 
   * @param message - Human-readable error message
   * @param category - Error category for classification
   * @param originalError - Original error that caused this error (optional)
   * @param context - Additional context about where/why the error occurred (optional)
   */
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    originalError?: unknown,
    context?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.originalError = originalError;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // TypeScript doesn't recognize captureStackTrace, so we use type assertion
    const ErrorConstructor = Error as unknown as IErrorConstructorWithCaptureStackTrace;
    if (ErrorConstructor.captureStackTrace) {
      ErrorConstructor.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error class for API-related errors
 * 
 * Used when API calls fail, network issues occur, or API responses are invalid.
 * This helps distinguish API errors from other types of errors for better handling.
 */
export class ApiError extends AppError {
  public readonly statusCode?: number;
  public readonly apiEndpoint?: string;

  /**
   * Creates a new ApiError instance
   * 
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code if available (optional)
   * @param apiEndpoint - API endpoint that failed (optional)
   * @param originalError - Original error that caused this error (optional)
   * @param context - Additional context about where/why the error occurred (optional)
   */
  constructor(
    message: string,
    statusCode?: number,
    apiEndpoint?: string,
    originalError?: unknown,
    context?: string
  ) {
    super(message, ErrorCategory.NETWORK, originalError, context);
    this.statusCode = statusCode;
    this.apiEndpoint = apiEndpoint;
  }
}

/**
 * Error class for permission and authorization errors
 * 
 * Used when a user lacks the necessary permissions to perform an operation
 * or when authentication/authorization fails.
 */
export class PermissionError extends AppError {
  /**
   * Creates a new PermissionError instance
   * 
   * @param message - Human-readable error message
   * @param originalError - Original error that caused this error (optional)
   * @param context - Additional context about where/why the error occurred (optional)
   */
  constructor(
    message: string,
    originalError?: unknown,
    context?: string
  ) {
    super(message, ErrorCategory.PERMISSION, originalError, context);
  }
}

/**
 * Error class for data validation errors
 * 
 * Used when data doesn't meet expected format, constraints, or business rules.
 * This helps distinguish validation errors from other types of errors.
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;

  /**
   * Creates a new ValidationError instance
   * 
   * @param message - Human-readable error message
   * @param field - Field name that failed validation (optional)
   * @param value - Value that failed validation (optional)
   * @param originalError - Original error that caused this error (optional)
   * @param context - Additional context about where/why the error occurred (optional)
   */
  constructor(
    message: string,
    field?: string,
    value?: unknown,
    originalError?: unknown,
    context?: string
  ) {
    super(message, ErrorCategory.VALIDATION, originalError, context);
    this.field = field;
    this.value = value;
  }
}
