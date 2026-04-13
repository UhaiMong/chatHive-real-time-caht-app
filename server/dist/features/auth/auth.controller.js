"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const auth_service_1 = require("./auth.service");
const response_1 = require("../../shared/utils/response");
const register = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_1.sendError)(res, 'Validation failed', 422, errors.array());
            return;
        }
        const result = await auth_service_1.authService.register(req.body);
        (0, response_1.sendSuccess)(res, result, 'Account created', 201);
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, response_1.sendError)(res, 'Validation failed', 422, errors.array());
            return;
        }
        const result = await auth_service_1.authService.login(req.body.email, req.body.password);
        (0, response_1.sendSuccess)(res, result, 'Login successful');
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            (0, response_1.sendError)(res, 'Refresh token required', 400);
            return;
        }
        const tokens = await auth_service_1.authService.refresh(refreshToken);
        (0, response_1.sendSuccess)(res, tokens, 'Tokens refreshed');
    }
    catch (err) {
        next(err);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        await auth_service_1.authService.logout(req.user.userId, refreshToken);
        (0, response_1.sendSuccess)(res, null, 'Logged out');
    }
    catch (err) {
        next(err);
    }
};
exports.logout = logout;
const me = async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, req.user, 'User info');
    }
    catch (err) {
        next(err);
    }
};
exports.me = me;
//# sourceMappingURL=auth.controller.js.map