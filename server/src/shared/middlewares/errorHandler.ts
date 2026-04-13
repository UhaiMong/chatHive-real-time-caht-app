import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: "Route not found" });
};
