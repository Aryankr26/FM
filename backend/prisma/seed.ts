import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const normalizeDatabaseUrl = (raw?: string): string | undefined => {
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const isSupabase = host.endsWith('.supabase.co') || host.endsWith('.pooler.supabase.com');
    const isPooler = host.endsWith('.pooler.supabase.com');

    if (isSupabase && !url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    if (isPooler && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }

    return url.toString();
  } catch {
    return raw;
  }
};

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.development'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.development'), override: true });

const normalized = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (normalized && normalized !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalized;
}

const normalizedDirect = normalizeDatabaseUrl(process.env.DIRECT_URL);
if (normalizedDirect && normalizedDirect !== process.env.DIRECT_URL) {
  process.env.DIRECT_URL = normalizedDirect;
}

type DemoUser = {
  email: string;
  role: string;
};

const demoUsers: DemoUser[] = [
  { email: 'owner@fleet.com', role: 'owner' },
  { email: 'supervisor@fleet.com', role: 'supervisor' },
  { email: 'admin@fleet.com', role: 'admin' },
];

async function main() {
  const demoPassword = process.env.DEMO_PASSWORD || 'password123';
  if (!process.env.DEMO_PASSWORD) {
    console.warn('DEMO_PASSWORD not set; defaulting demo user password to "password123"');
  }

  const prisma = new PrismaClient();

  try {
    const hashed = await bcrypt.hash(demoPassword, 10);

    for (const u of demoUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          password: hashed,
          role: u.role,
        },
        create: {
          email: u.email,
          password: hashed,
          role: u.role,
        },
      });
    }

    console.log('Seeded demo users:', demoUsers.map((u) => u.email).join(', '));
  } finally {
    await prisma.$disconnect();
  }
}

void main();
