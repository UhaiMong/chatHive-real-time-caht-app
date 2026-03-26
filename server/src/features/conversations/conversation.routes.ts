import { Router } from 'express';
import * as controller from './conversation.controller';
import { authenticate } from '../../shared/middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', controller.getMyConversations);
router.post('/group', controller.createGroup);
router.get('/direct/:userId', controller.getOrCreateDirect);
router.get('/:conversationId', controller.getConversation);
router.patch('/:conversationId', controller.updateGroup);
router.post('/:conversationId/participants', controller.addParticipants);
router.delete('/:conversationId/participants/:userId', controller.removeParticipant);
router.delete('/:conversationId/leave', controller.leaveGroup);

export default router;
