import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  API_PREFIX: process.env.API_PREFIX ?? '/api/v1',
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY ?? '8h',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? 'change-me-refresh',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY ?? '7d',
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX: 100,
} as const;
