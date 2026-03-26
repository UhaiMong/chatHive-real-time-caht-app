import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import { messageService } from './message.service';
import { sendSuccess } from '../../shared/utils/response';
import path from 'path';

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const result = await messageService.getMessages(req.params.conversationId, req.user!.userId, cursor);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let media: Parameters<typeof messageService.send>[0]['media'];
    if (req.file) {
      const mimeType = req.file.mimetype;
      let fileType: 'image' | 'video' | 'audio' | 'file' = 'file';
      if (mimeType.startsWith('image/')) fileType = 'image';
      else if (mimeType.startsWith('video/')) fileType = 'video';
      else if (mimeType.startsWith('audio/')) fileType = 'audio';

      media = {
        url: `/uploads/${req.file.filename}`,
        type: fileType,
        name: req.file.originalname,
        size: req.file.size,
        mimeType,
      };
    }

    const message = await messageService.send({
      conversationId: req.params.conversationId,
      senderId: req.user!.userId,
      type: media ? media.type : 'text',
      content: req.body.content ?? '',
      media,
      replyTo: req.body.replyTo,
    });

    sendSuccess(res, message, 'Message sent', 201);
  } catch (err) { next(err); }
};

export const markRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await messageService.markRead(req.params.conversationId, req.user!.userId);
    sendSuccess(res, null, 'Marked as read');
  } catch (err) { next(err); }
};

export const editMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const msg = await messageService.editMessage(req.params.messageId, req.user!.userId, req.body.content);
    sendSuccess(res, msg, 'Message edited');
  } catch (err) { next(err); }
};

export const deleteForMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await messageService.deleteForMe(req.params.messageId, req.user!.userId);
    sendSuccess(res, null, 'Deleted for you');
  } catch (err) { next(err); }
};

export const deleteForEveryone = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await messageService.deleteForEveryone(req.params.messageId, req.user!.userId);
    sendSuccess(res, null, 'Deleted for everyone');
  } catch (err) { next(err); }
};

export const searchMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query.q as string ?? '';
    const messages = await messageService.searchMessages(req.params.conversationId, req.user!.userId, q);
    sendSuccess(res, messages);
  } catch (err) { next(err); }
};
