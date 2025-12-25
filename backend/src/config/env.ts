import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().min(1).default('http://localhost:3000'),
  CORS_ORIGINS: z.string().optional().default(''),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).optional(),
});

const parse = envSchema.safeParse(process.env);
if (!parse.success) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(parse.error.flatten().fieldErrors)}`);
}

const normalizeOrigin = (value: string): string => {
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}`;
  } catch {
    return value;
  }
};

const buildCorsOrigins = (frontendUrl: string, corsOrigins: string, nodeEnv: string): string[] => {
  const origins = new Set<string>();
  origins.add(normalizeOrigin(frontendUrl));

  if (corsOrigins) {
    corsOrigins
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((o) => origins.add(normalizeOrigin(o)));
  }

  if (nodeEnv !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }

  return Array.from(origins);
};

export const env = {
  server: {
    port: parse.data.PORT ?? 4000,
    nodeEnv: parse.data.NODE_ENV,
  },
  auth: {
    jwtSecret: parse.data.JWT_SECRET,
  },
  frontend: {
    url: normalizeOrigin(parse.data.FRONTEND_URL),
  },
  cors: {
    origins: buildCorsOrigins(parse.data.FRONTEND_URL, parse.data.CORS_ORIGINS ?? '', parse.data.NODE_ENV),
  },
  logger: {
    level: parse.data.LOG_LEVEL,
  },
};
