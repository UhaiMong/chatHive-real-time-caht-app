import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response;
export declare const sendError: (res: Response, message: string, statusCode?: number, errors?: Record<string, string>[]) => Response;
export declare const paginate: (page: number, limit: number) => {
    skip: number;
    limit: number;
};
//# sourceMappingURL=response.d.ts.map