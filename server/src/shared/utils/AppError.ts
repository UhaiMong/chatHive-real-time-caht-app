// src/shared/utils/AppError.ts

/**
 * Standard error codes used across the application.
 * Extend this enum as your domain grows.
 */
export enum ErrorCode {
  // Generic
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  UNPROCESSABLE = "UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  INTERNAL_ERROR = "INTERNAL_SERVER_ERROR",

  // Auth domain
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  ACCOUNT_BANNED = "ACCOUNT_BANNED",

  // Conversation domain
  CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND",
  NOT_A_PARTICIPANT = "NOT_A_PARTICIPANT",
  NOT_GROUP_ADMIN = "NOT_GROUP_ADMIN",
  DIRECT_CONV_EXISTS = "DIRECT_CONV_EXISTS",

  // User domain
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_TAKEN = "EMAIL_TAKEN",
}

/**
 * Serialised shape sent to the client in every error response.
 */
export interface AppErrorPayload {
  status: "error" | "fail";
  code: ErrorCode | string;
  message: string;
  details?: unknown; // Validation errors, field-level info, etc.
  stack?: string; // Only in development
}

/**
 * AppError — the single error class used throughout the application.
 *
 * Operational errors (isOperational = true) are safe to expose to clients.
 * Programming errors (isOperational = false) are caught by the global
 * error handler and returned as a generic 500.
 *
 * @example
 *   throw new AppError('Conversation not found', 404, ErrorCode.CONVERSATION_NOT_FOUND);
 *   throw new AppError('Validation failed', 400, ErrorCode.BAD_REQUEST, fieldErrors);
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode | string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode | string = ErrorCode.INTERNAL_ERROR,
    details?: unknown,
    isOperational: boolean = true,
  ) {
    super(message);

    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Capture a clean stack trace that starts at the call-site, not here
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Convenience Factories ─────────────────────────────────────────────────

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, ErrorCode.BAD_REQUEST, details);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, 401, ErrorCode.UNAUTHORIZED);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(message, 403, ErrorCode.FORBIDDEN);
  }

  static notFound(resource = "Resource"): AppError {
    return new AppError(`${resource} not found`, 404, ErrorCode.NOT_FOUND);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, 409, ErrorCode.CONFLICT, details);
  }

  static tooManyRequests(message = "Too many requests"): AppError {
    return new AppError(message, 429, ErrorCode.TOO_MANY_REQUESTS);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(
      message,
      500,
      ErrorCode.INTERNAL_ERROR,
      undefined,
      false,
    );
  }

  // ─── Serialiser

  /**
   * Returns the safe-to-send payload for the client.
   * Stack trace is only included in development.
   */
  toJSON(includeStack = false): AppErrorPayload {
    return {
      status: this.statusCode >= 500 ? "error" : "fail",
      code: this.code,
      message: this.message,
      ...(this.details !== undefined && { details: this.details }),
      ...(includeStack && { stack: this.stack }),
    };
  }
}
