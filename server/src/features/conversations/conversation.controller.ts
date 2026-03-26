import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { conversationService } from './conversation.service';
import { sendSuccess } from '../../shared/utils/response';

export const getMyConversations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const convs = await conversationService.getUserConversations(req.user!.userId);
    sendSuccess(res, convs);
  } catch (err) { next(err); }
};

export const getOrCreateDirect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conv = await conversationService.getOrCreateDirect(req.user!.userId, req.params.userId);
    sendSuccess(res, conv, 'Conversation ready', 200);
  } catch (err) { next(err); }
};

export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, participantIds } = req.body;
    const conv = await conversationService.createGroup(req.user!.userId, name, participantIds);
    sendSuccess(res, conv, 'Group created', 201);
  } catch (err) { next(err); }
};

export const getConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conv = await conversationService.getById(req.params.conversationId, req.user!.userId);
    sendSuccess(res, conv);
  } catch (err) { next(err); }
};

export const updateGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conv = await conversationService.updateGroup(req.params.conversationId, req.user!.userId, req.body);
    sendSuccess(res, conv, 'Group updated');
  } catch (err) { next(err); }
};

export const addParticipants = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conv = await conversationService.addParticipants(req.params.conversationId, req.user!.userId, req.body.userIds);
    sendSuccess(res, conv);
  } catch (err) { next(err); }
};

export const removeParticipant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conv = await conversationService.removeParticipant(req.params.conversationId, req.user!.userId, req.params.userId);
    sendSuccess(res, conv);
  } catch (err) { next(err); }
};

export const leaveGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await conversationService.leaveGroup(req.params.conversationId, req.user!.userId);
    sendSuccess(res, null, 'Left group');
  } catch (err) { next(err); }
};
