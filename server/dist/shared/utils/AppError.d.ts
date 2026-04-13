/**
 * Standard error codes used across the application.
 * Extend this enum as your domain grows.
 */
export declare enum ErrorCode {
    BAD_REQUEST = "BAD_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    UNPROCESSABLE = "UNPROCESSABLE_ENTITY",
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
    INTERNAL_ERROR = "INTERNAL_SERVER_ERROR",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TOKEN_INVALID = "TOKEN_INVALID",
    ACCOUNT_BANNED = "ACCOUNT_BANNED",
    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND",
    NOT_A_PARTICIPANT = "NOT_A_PARTICIPANT",
    NOT_GROUP_ADMIN = "NOT_GROUP_ADMIN",
    DIRECT_CONV_EXISTS = "DIRECT_CONV_EXISTS",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    EMAIL_TAKEN = "EMAIL_TAKEN"
}
/**
 * Serialised shape sent to the client in every error response.
 */
export interface AppErrorPayload {
    status: "error" | "fail";
    code: ErrorCode | string;
    message: string;
    details?: unknown;
    stack?: string;
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
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: ErrorCode | string;
    readonly isOperational: boolean;
    readonly details?: unknown;
    constructor(message: string, statusCode?: number, code?: ErrorCode | string, details?: unknown, isOperational?: boolean);
    static badRequest(message: string, details?: unknown): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static notFound(resource?: string): AppError;
    static conflict(message: string, details?: unknown): AppError;
    static tooManyRequests(message?: string): AppError;
    static internal(message?: string): AppError;
    /**
     * Returns the safe-to-send payload for the client.
     * Stack trace is only included in development.
     */
    toJSON(includeStack?: boolean): AppErrorPayload;
}
//# sourceMappingURL=AppError.d.ts.map