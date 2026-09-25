import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8080'),
  API_PREFIX: z.string().default('/api/v1'),
  JWT_SECRET: z.string().min(16).default('development_jwt_secret_must_be_long_and_secure_123'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/aura_expense?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:8080/api/v1/email-accounts/gmail/callback'),
  MICROSOFT_CLIENT_ID: z.string().optional().default(''),
  MICROSOFT_CLIENT_SECRET: z.string().optional().default(''),
  MICROSOFT_TENANT_ID: z.string().default('common'),
  MICROSOFT_REDIRECT_URI: z.string().default('http://localhost:8080/api/v1/email-accounts/outlook/callback'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
