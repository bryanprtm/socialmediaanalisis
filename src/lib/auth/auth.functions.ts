// Client-safe wrappers — server-only modules loaded inside .handler().
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireAuth } from './middleware';

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120).optional(),
});

export const registerUser = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => credsSchema.parse(input))
  .handler(async ({ data }) => {
    const { db, schema } = await import('@/db/client.server');
    const { hashPassword } = await import('./password');
    const { setAuthCookie } = await import('./session.server');
    const { eq } = await import('drizzle-orm');

    const existing = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
    if (existing.length > 0) {
      throw new Error('Email sudah terdaftar');
    }

    const passwordHash = await hashPassword(data.password);
    const [created] = await db
      .insert(schema.users)
      .values({ email: data.email, passwordHash, displayName: data.displayName ?? null })
      .returning({ id: schema.users.id, email: schema.users.email });

    // First user becomes admin
    const allUsers = await db.select({ id: schema.users.id }).from(schema.users).limit(2);
    if (allUsers.length === 1) {
      await db.insert(schema.userRoles).values({ userId: created.id, role: 'admin' });
    } else {
      await db.insert(schema.userRoles).values({ userId: created.id, role: 'user' });
    }

    setAuthCookie({ sub: created.id, email: created.email });
    return { id: created.id, email: created.email };
  });

export const loginUser = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => credsSchema.pick({ email: true, password: true }).parse(input))
  .handler(async ({ data }) => {
    const { db, schema } = await import('@/db/client.server');
    const { verifyPassword } = await import('./password');
    const { setAuthCookie } = await import('./session.server');
    const { eq } = await import('drizzle-orm');

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
    if (!user) throw new Error('Email atau password salah');

    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) throw new Error('Email atau password salah');

    setAuthCookie({ sub: user.id, email: user.email });
    return { id: user.id, email: user.email };
  });

export const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  const { clearAuthCookie } = await import('./session.server');
  clearAuthCookie();
  return { ok: true };
});

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  const { readAuthCookie } = await import('./session.server');
  const payload = readAuthCookie();
  if (!payload) return null;

  const { db, schema } = await import('@/db/client.server');
  const { eq } = await import('drizzle-orm');
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email, displayName: schema.users.displayName })
    .from(schema.users)
    .where(eq(schema.users.id, payload.sub))
    .limit(1);
  return user ?? null;
});

export const getMyRoles = createServerFn({ method: 'GET' })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { db, schema } = await import('@/db/client.server');
    const { eq } = await import('drizzle-orm');
    const rows = await db
      .select({ role: schema.userRoles.role })
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, context.userId));
    return rows.map((r) => r.role);
  });
