// src/shared/utils/errorHandler.ts
// Global Express error-handling middleware — wire this up last in app.ts

import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError, ErrorCode } from "./AppError";

const isDev = process.env.NODE_ENV === "development";

/**
 * Normalises known third-party errors into AppError instances.
 */
function normalise(err: unknown): AppError {
  // Already one of ours
  if (err instanceof AppError) return err;

  // Mongoose: duplicate key (e.g. unique email)
  if (
    typeof err === "object" &&
    err !== null &&
    (err as NodeJS.ErrnoException).name === "MongoServerError" &&
    (err as { code?: number }).code === 11000
  ) {
    const field = Object.keys(
      (err as { keyValue?: Record<string, unknown> }).keyValue ?? {},
    )[0];
    return new AppError(
      `${field ?? "Field"} already exists`,
      409,
      ErrorCode.CONFLICT,
      { field },
    );
  }

  // Mongoose: validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new AppError(
      "Validation failed",
      422,
      ErrorCode.UNPROCESSABLE,
      details,
    );
  }

  // Mongoose: bad ObjectId cast
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(
      `Invalid value for field '${err.path}'`,
      400,
      ErrorCode.BAD_REQUEST,
    );
  }

  // JWT errors (if you use jsonwebtoken)
  if (typeof err === "object" && err !== null) {
    const name = (err as { name?: string }).name;
    if (name === "JsonWebTokenError") {
      return new AppError("Invalid token", 401, ErrorCode.TOKEN_INVALID);
    }
    if (name === "TokenExpiredError") {
      return new AppError("Token has expired", 401, ErrorCode.TOKEN_EXPIRED);
    }
  }

  // Unknown/programming error — don't leak details
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  return new AppError(message, 500, ErrorCode.INTERNAL_ERROR, undefined, false);
}

/**
 * Mount as the LAST middleware in app.ts:
 *   app.use(globalErrorHandler);
 */
export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  const appErr = normalise(err);

  // Log non-operational (programming) errors loudly
  if (!appErr.isOperational) {
    console.error("🔴 UNHANDLED ERROR:", appErr);
  }

  res.status(appErr.statusCode).json(appErr.toJSON(isDev));
};
