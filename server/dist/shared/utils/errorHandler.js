"use strict";
// src/shared/utils/errorHandler.ts
// Global Express error-handling middleware — wire this up last in app.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("./AppError");
const isDev = process.env.NODE_ENV === "development";
/**
 * Normalises known third-party errors into AppError instances.
 */
function normalise(err) {
    // Already one of ours
    if (err instanceof AppError_1.AppError)
        return err;
    // Mongoose: duplicate key (e.g. unique email)
    if (typeof err === "object" &&
        err !== null &&
        err.name === "MongoServerError" &&
        err.code === 11000) {
        const field = Object.keys(err.keyValue ?? {})[0];
        return new AppError_1.AppError(`${field ?? "Field"} already exists`, 409, AppError_1.ErrorCode.CONFLICT, { field });
    }
    // Mongoose: validation error
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return new AppError_1.AppError("Validation failed", 422, AppError_1.ErrorCode.UNPROCESSABLE, details);
    }
    // Mongoose: bad ObjectId cast
    if (err instanceof mongoose_1.default.Error.CastError) {
        return new AppError_1.AppError(`Invalid value for field '${err.path}'`, 400, AppError_1.ErrorCode.BAD_REQUEST);
    }
    // JWT errors (if you use jsonwebtoken)
    if (typeof err === "object" && err !== null) {
        const name = err.name;
        if (name === "JsonWebTokenError") {
            return new AppError_1.AppError("Invalid token", 401, AppError_1.ErrorCode.TOKEN_INVALID);
        }
        if (name === "TokenExpiredError") {
            return new AppError_1.AppError("Token has expired", 401, AppError_1.ErrorCode.TOKEN_EXPIRED);
        }
    }
    // Unknown/programming error — don't leak details
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return new AppError_1.AppError(message, 500, AppError_1.ErrorCode.INTERNAL_ERROR, undefined, false);
}
/**
 * Mount as the LAST middleware in app.ts:
 *   app.use(globalErrorHandler);
 */
const globalErrorHandler = (err, req, res, next) => {
    const appErr = normalise(err);
    // Log non-operational (programming) errors loudly
    if (!appErr.isOperational) {
        console.error("UNHANDLED ERROR:", appErr);
    }
    res.status(appErr.statusCode).json(appErr.toJSON(isDev));
};
exports.globalErrorHandler = globalErrorHandler;
//# sourceMappingURL=errorHandler.js.map