import dotenv from 'dotenv';
import path from 'path';

// Load backend/.env so DATABASE_URL is set before Prisma Client loads (run seed from backend/)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
