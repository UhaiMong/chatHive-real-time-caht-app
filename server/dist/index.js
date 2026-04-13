"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const socket_1 = require("./socket");
// Ensure upload directory exists
const uploadDir = path_1.default.join(process.cwd(), env_1.config.upload.dir);
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const httpServer = (0, http_1.createServer)(app_1.default);
// Init Socket.io
(0, socket_1.initSocket)(httpServer);
const start = async () => {
    await (0, database_1.connectDB)();
    httpServer.listen(env_1.config.port, () => {
        console.log(`ChatHive server running on port ${env_1.config.port}`);
        console.log(`Environment: ${env_1.config.nodeEnv}`);
    });
};
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map