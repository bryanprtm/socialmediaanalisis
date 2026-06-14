// Helper RBAC untuk auth lokal (pengganti SQL function `has_role`).
// HANYA boleh dipanggil dari konteks server (server function / route handler).
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client.server';
import { userRoles, type AppRole } from '@/db/schema';

/** Cek apakah user punya role tertentu. */
export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const rows = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)))
    .limit(1);
  return rows.length > 0;
}

/** Lempar error 403 kalau bukan admin. */
export async function requireAdmin(userId: string): Promise<void> {
  const ok = await hasRole(userId, 'admin');
  if (!ok) throw new Error('Forbidden: admin role required');
}

/** Ambil semua role milik user. */
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  return rows.map((r) => r.role);
}
