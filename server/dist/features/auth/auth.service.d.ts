import { IUser } from '../users/user.model';
interface RegisterInput {
    username: string;
    email: string;
    password: string;
}
interface AuthResult {
    user: Partial<IUser>;
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    #private;
    register(input: RegisterInput): Promise<AuthResult>;
    login(email: string, password: string): Promise<AuthResult>;
    refresh(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, token: string): Promise<void>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth.service.d.ts.map