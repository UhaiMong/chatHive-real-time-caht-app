"use strict";
// src/shared/utils/AppError.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.ErrorCode = void 0;
/**
 * Standard error codes used across the application.
 * Extend this enum as your domain grows.
 */
var ErrorCode;
(function (ErrorCode) {
    // Generic
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["UNPROCESSABLE"] = "UNPROCESSABLE_ENTITY";
    ErrorCode["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_SERVER_ERROR";
    // Auth domain
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
    ErrorCode["ACCOUNT_BANNED"] = "ACCOUNT_BANNED";
    // Conversation domain
    ErrorCode["CONVERSATION_NOT_FOUND"] = "CONVERSATION_NOT_FOUND";
    ErrorCode["NOT_A_PARTICIPANT"] = "NOT_A_PARTICIPANT";
    ErrorCode["NOT_GROUP_ADMIN"] = "NOT_GROUP_ADMIN";
    ErrorCode["DIRECT_CONV_EXISTS"] = "DIRECT_CONV_EXISTS";
    // User domain
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["EMAIL_TAKEN"] = "EMAIL_TAKEN";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
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
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(message, statusCode = 500, code = ErrorCode.INTERNAL_ERROR, details, isOperational = true) {
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
    static badRequest(message, details) {
        return new AppError(message, 400, ErrorCode.BAD_REQUEST, details);
    }
    static unauthorized(message = "Unauthorized") {
        return new AppError(message, 401, ErrorCode.UNAUTHORIZED);
    }
    static forbidden(message = "Forbidden") {
        return new AppError(message, 403, ErrorCode.FORBIDDEN);
    }
    static notFound(resource = "Resource") {
        return new AppError(`${resource} not found`, 404, ErrorCode.NOT_FOUND);
    }
    static conflict(message, details) {
        return new AppError(message, 409, ErrorCode.CONFLICT, details);
    }
    static tooManyRequests(message = "Too many requests") {
        return new AppError(message, 429, ErrorCode.TOO_MANY_REQUESTS);
    }
    static internal(message = "Internal server error") {
        return new AppError(message, 500, ErrorCode.INTERNAL_ERROR, undefined, false);
    }
    // ─── Serialiser
    /**
     * Returns the safe-to-send payload for the client.
     * Stack trace is only included in development.
     */
    toJSON(includeStack = false) {
        return {
            status: this.statusCode >= 500 ? "error" : "fail",
            code: this.code,
            message: this.message,
            ...(this.details !== undefined && { details: this.details }),
            ...(includeStack && { stack: this.stack }),
        };
    }
}
exports.AppError = AppError;
//# sourceMappingURL=AppError.js.map