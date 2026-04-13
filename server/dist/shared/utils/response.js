"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    const response = { success: true, message, data };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 400, errors) => {
    const response = { success: false, message, errors };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
const paginate = (page, limit) => ({
    skip: (page - 1) * limit,
    limit,
});
exports.paginate = paginate;
//# sourceMappingURL=response.js.map