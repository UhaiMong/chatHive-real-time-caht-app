import dotenv from "dotenv";
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),
  mongoUri: requireEnv("MONGODB_URI"),
  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  },
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  upload: {
    dir: process.env.UPLOAD_DIR ?? "uploads",
    maxSize: parseInt(process.env.MAX_FILE_SIZE ?? "10485760", 10),
  },
} as const;
