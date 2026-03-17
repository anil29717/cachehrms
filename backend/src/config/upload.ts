import path from 'path';
import fs from 'fs';
import { env } from './env.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), env.UPLOAD_DIR);

export const ALLOWED_DOCUMENT_MIMES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function ensureUploadDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getOnboardingUploadDir(onboardingId: string): string {
  const dir = path.join(UPLOAD_DIR, 'onboarding', onboardingId);
  ensureUploadDir(dir);
  return dir;
}
