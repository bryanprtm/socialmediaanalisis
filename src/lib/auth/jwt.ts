import jwt, { type SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET is not configured (must be at least 16 chars). Set it in .env');
  }
  return secret;
}

export function signJwt(payload: JwtPayload, expiresIn: SignOptions['expiresIn'] = '7d'): string {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === 'string') return null;
    if (typeof decoded.sub !== 'string' || typeof decoded.email !== 'string') return null;
    return { sub: decoded.sub, email: decoded.email };
  } catch {
    return null;
  }
}
