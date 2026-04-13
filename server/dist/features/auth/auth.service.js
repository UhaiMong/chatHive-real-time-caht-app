"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const user_model_1 = require("../users/user.model");
const jwt_1 = require("../../shared/utils/jwt");
class AuthService {
    async register(input) {
        const existing = await user_model_1.User.findOne({ email: input.email });
        if (existing)
            throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
        const user = await user_model_1.User.create(input);
        return this.#generateTokenPair(user);
    }
    async login(email, password) {
        const user = await user_model_1.User.findOne({ email, isDeleted: false }).select('+password +refreshTokens');
        if (!user || !(await user.comparePassword(password))) {
            throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
        }
        return this.#generateTokenPair(user);
    }
    async refresh(token) {
        const payload = (0, jwt_1.verifyRefreshToken)(token);
        const user = await user_model_1.User.findById(payload.userId).select('+refreshTokens');
        if (!user || !user.refreshTokens.includes(token)) {
            throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
        }
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user._id.toString(), email: user.email });
        const newRefresh = (0, jwt_1.generateRefreshToken)({ userId: user._id.toString(), email: user.email });
        user.refreshTokens = user.refreshTokens
            .filter(t => t !== token)
            .concat(newRefresh)
            .slice(-5); // keep last 5
        await user.save();
        return { accessToken, refreshToken: newRefresh };
    }
    async logout(userId, token) {
        await user_model_1.User.findByIdAndUpdate(userId, { $pull: { refreshTokens: token } });
    }
    async #generateTokenPair(user) {
        const payload = { userId: user._id.toString(), email: user.email };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        await user_model_1.User.findByIdAndUpdate(user._id, {
            $push: { refreshTokens: { $each: [refreshToken], $slice: -5 } },
        });
        const { password: _, refreshTokens: __, ...safeUser } = user.toObject();
        return { user: safeUser, accessToken, refreshToken };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map