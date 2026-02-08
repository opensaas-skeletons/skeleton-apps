/**
 * Custom Error Classes
 * ====================
 * Structured errors for consistent API error responses.
 *
 * LLM BUILDERS: Add new error classes here as needed.
 * They'll be automatically handled by the global error handler in index.ts.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}
