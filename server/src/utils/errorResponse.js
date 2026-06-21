/**
 * ErrorResponse - Custom error class to attach HTTP status codes
 * to thrown exceptions, enabling cleaner error propagation.
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capture stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorResponse;
