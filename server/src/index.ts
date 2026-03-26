import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import app from './app';
import { connectDB } from './config/database';
import { config } from './config/env';
import { initSocket } from './socket';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), config.upload.dir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const httpServer = createServer(app);

// Init Socket.io
initSocket(httpServer);

const start = async () => {
  await connectDB();

  httpServer.listen(config.port, () => {
    console.log(`🚀 ChatHive server running on port ${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
  });
};

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
