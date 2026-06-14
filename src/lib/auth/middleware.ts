// Server-fn middleware: requireAuth.
// Drop-in replacement for requireSupabaseAuth once Phase 2 migration starts.
import { createMiddleware } from '@tanstack/react-start';
import { readAuthCookie } from './session.server';

export const requireAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const payload = readAuthCookie();
  if (!payload) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return next({
    context: {
      userId: payload.sub,
      userEmail: payload.email,
    },
  });
});
