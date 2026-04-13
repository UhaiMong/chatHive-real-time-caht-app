import { IUser } from './user.model';
export declare class UserService {
    getProfile(userId: string): Promise<IUser>;
    updateProfile(userId: string, updates: {
        username?: string;
        bio?: string;
        avatar?: string;
    }): Promise<IUser>;
    searchUsers(query: string, currentUserId: string): Promise<Partial<IUser>[]>;
    updateStatus(userId: string, status: 'online' | 'offline' | 'away'): Promise<void>;
    blockUser(userId: string, targetId: string): Promise<void>;
    unblockUser(userId: string, targetId: string): Promise<void>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map