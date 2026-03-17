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
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? './uploads',
  /** Microsoft SSO (optional). Frontend URL for redirect after SSO (e.g. http://localhost:3000). */
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ?? '',
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET ?? '',
  /** Azure AD tenant ID for single-tenant apps. If set, use /{tenant}/...; if empty, use /common (multi-tenant only). */
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID ?? '',
  /** Shown in onboarding invite email (company name and details). */
  COMPANY_NAME: process.env.COMPANY_NAME ?? 'Company',
  COMPANY_DETAILS: process.env.COMPANY_DETAILS ?? '',
  /** Default password set when HR activates onboarding; include in invite email so employee knows login password. */
  ONBOARDING_DEFAULT_PASSWORD: process.env.ONBOARDING_DEFAULT_PASSWORD ?? 'ChangeMe@123',
} as const;
