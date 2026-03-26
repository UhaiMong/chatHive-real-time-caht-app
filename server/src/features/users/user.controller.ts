import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { userService } from './user.service';
import { sendSuccess } from '../../shared/utils/response';
import { config } from '../../config/env';
import path from 'path';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.userId ?? req.user!.userId;
    const user = await userService.getProfile(userId);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates: { username?: string; bio?: string; avatar?: string } = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }
    const user = await userService.updateProfile(req.user!.userId, updates);
    sendSuccess(res, user, 'Profile updated');
  } catch (err) { next(err); }
};

export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query.q as string ?? '';
    const users = await userService.searchUsers(q, req.user!.userId);
    sendSuccess(res, users);
  } catch (err) { next(err); }
};

export const blockUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await userService.blockUser(req.user!.userId, req.params.userId);
    sendSuccess(res, null, 'User blocked');
  } catch (err) { next(err); }
};

export const unblockUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await userService.unblockUser(req.user!.userId, req.params.userId);
    sendSuccess(res, null, 'User unblocked');
  } catch (err) { next(err); }
};
