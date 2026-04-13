"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_model_1 = require("./user.model");
const mongoose_1 = __importDefault(require("mongoose"));
class UserService {
    async getProfile(userId) {
        const user = await user_model_1.User.findById(userId).select('-password -refreshTokens -blockedUsers');
        if (!user || user.isDeleted)
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        return user;
    }
    async updateProfile(userId, updates) {
        const user = await user_model_1.User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('-password -refreshTokens');
        if (!user)
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        return user;
    }
    async searchUsers(query, currentUserId) {
        if (!query.trim())
            return [];
        return user_model_1.User.find({
            $and: [
                { isDeleted: false },
                { _id: { $ne: new mongoose_1.default.Types.ObjectId(currentUserId) } },
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                    ],
                },
            ],
        })
            .select('_id username email avatar status lastSeen')
            .limit(20);
    }
    async updateStatus(userId, status) {
        await user_model_1.User.findByIdAndUpdate(userId, {
            status,
            ...(status === 'offline' ? { lastSeen: new Date() } : {}),
        });
    }
    async blockUser(userId, targetId) {
        await user_model_1.User.findByIdAndUpdate(userId, {
            $addToSet: { blockedUsers: new mongoose_1.default.Types.ObjectId(targetId) },
        });
    }
    async unblockUser(userId, targetId) {
        await user_model_1.User.findByIdAndUpdate(userId, {
            $pull: { blockedUsers: new mongoose_1.default.Types.ObjectId(targetId) },
        });
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map