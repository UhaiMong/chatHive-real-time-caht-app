import { User, IUser } from '../users/user.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';

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

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email });
    if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

    const user = await User.create(input);
    return this.#generateTokenPair(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.findOne({ email, isDeleted: false }).select('+password +refreshTokens');
    if (!user || !(await user.comparePassword(password))) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }
    return this.#generateTokenPair(user);
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(token)) {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const newRefresh = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    user.refreshTokens = user.refreshTokens
      .filter(t => t !== token)
      .concat(newRefresh)
      .slice(-5); // keep last 5
    await user.save();

    return { accessToken, refreshToken: newRefresh };
  }

  async logout(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: token } });
  }

  async #generateTokenPair(user: IUser): Promise<AuthResult> {
    const payload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { $each: [refreshToken], $slice: -5 } },
    });

    const { password: _, refreshTokens: __, ...safeUser } = user.toObject();

    return { user: safeUser, accessToken, refreshToken };
  }
}

export const authService = new AuthService();
