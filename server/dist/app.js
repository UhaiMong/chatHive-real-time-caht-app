"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./features/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./features/users/user.routes"));
const conversation_routes_1 = __importDefault(require("./features/conversations/conversation.routes"));
const message_routes_1 = __importDefault(require("./features/messages/message.routes"));
const errorHandler_1 = require("./shared/middlewares/errorHandler");
const errorHandler_2 = require("./shared/utils/errorHandler");
const app = (0, express_1.default)();
// Core middleware
app.use((0, cors_1.default)({ origin: env_1.config.clientUrl, credentials: true }));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
if (env_1.config.nodeEnv !== "test")
    app.use((0, morgan_1.default)("dev"));
//  Static files (uploads)
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), env_1.config.upload.dir)));
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/conversations", conversation_routes_1.default);
app.use("/api/conversations/:conversationId/messages", message_routes_1.default);
// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date() }));
// Error handling
app.use(errorHandler_1.notFound);
app.use(errorHandler_2.globalErrorHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map