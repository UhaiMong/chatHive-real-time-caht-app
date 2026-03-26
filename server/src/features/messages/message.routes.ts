import { Router } from 'express';
import * as controller from './message.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { upload } from '../../shared/middlewares/upload';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get('/', controller.getMessages);
router.post('/', upload.single('media'), controller.sendMessage);
router.post('/read', controller.markRead);
router.get('/search', controller.searchMessages);
router.patch('/:messageId', controller.editMessage);
router.delete('/:messageId/me', controller.deleteForMe);
router.delete('/:messageId/all', controller.deleteForEveryone);

export default router;
