import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { upload } from '../../shared/middlewares/upload';

const router = Router();

router.use(authenticate);

router.get('/search', userController.searchUsers);
router.get('/profile', userController.getProfile);
router.get('/:userId', userController.getProfile);
router.patch('/profile', upload.single('avatar'), userController.updateProfile);
router.post('/:userId/block', userController.blockUser);
router.delete('/:userId/block', userController.unblockUser);

export default router;
