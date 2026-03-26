import { User, IUser } from './user.model';
import mongoose from 'mongoose';

export class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-password -refreshTokens -blockedUsers');
    if (!user || user.isDeleted) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  async updateProfile(
    userId: string,
    updates: { username?: string; bio?: string; avatar?: string }
  ): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  async searchUsers(query: string, currentUserId: string): Promise<Partial<IUser>[]> {
    if (!query.trim()) return [];
    return User.find({
      $and: [
        { isDeleted: false },
        { _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } },
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

  async updateStatus(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      status,
      ...(status === 'offline' ? { lastSeen: new Date() } : {}),
    });
  }

  async blockUser(userId: string, targetId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: new mongoose.Types.ObjectId(targetId) },
    });
  }

  async unblockUser(userId: string, targetId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: new mongoose.Types.ObjectId(targetId) },
    });
  }
}

export const userService = new UserService();
