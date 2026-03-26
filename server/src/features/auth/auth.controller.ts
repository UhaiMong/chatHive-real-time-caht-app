import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { authService } from './auth.service';
import { AuthRequest } from '../../shared/types';
import { sendSuccess, sendError } from '../../shared/utils/response';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array() as never);
      return;
    }
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'Account created', 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendError(res, 'Validation failed', 422, errors.array() as never);
      return;
    }
    const result = await authService.login(req.body.email, req.body.password);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { sendError(res, 'Refresh token required', 400); return; }
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, tokens, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user!.userId, refreshToken);
    sendSuccess(res, null, 'Logged out');
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, req.user, 'User info');
  } catch (err) {
    next(err);
  }
};
