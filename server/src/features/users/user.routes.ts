import { Router } from "express";
import * as userController from "./user.controller";
import { authenticate } from "../../shared/middlewares/authenticate";
import { upload } from "../../shared/middlewares/upload";
import { getOnlineUsers } from "../../socket";

const router = Router();
// Get online user
router.get("/online", (_req, res) => {
  res.json(getOnlineUsers());
});

router.use(authenticate);

router.get("/search", userController.searchUsers);
router.get("/profile", userController.getProfile);
router.get("/:userId", userController.getProfile);
router.patch("/profile", upload.single("avatar"), userController.updateProfile);
router.post("/:userId/block", userController.blockUser);
router.delete("/:userId/block", userController.unblockUser);

export default router;
