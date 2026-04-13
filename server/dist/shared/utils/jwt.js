"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const generateAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.config.jwt.accessSecret, {
    expiresIn: env_1.config.jwt.accessExpires,
});
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.config.jwt.refreshSecret, {
    expiresIn: env_1.config.jwt.refreshExpires,
});
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => jsonwebtoken_1.default.verify(token, env_1.config.jwt.accessSecret);
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => jsonwebtoken_1.default.verify(token, env_1.config.jwt.refreshSecret);
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=jwt.js.map