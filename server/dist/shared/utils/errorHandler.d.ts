import { Request, Response, NextFunction } from "express";
/**
 * Mount as the LAST middleware in app.ts:
 *   app.use(globalErrorHandler);
 */
export declare const globalErrorHandler: (err: unknown, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map