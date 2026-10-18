/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { globalStore } from '../db/store.js';
import { User, Session, Organization, Membership } from '../db/types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  org?: Organization;
  membership?: Membership;
  session?: Session;
}

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Hash a plaintext password with a unique salt using scrypt.
 */
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

/**
 * Verify a password against stored salt and hash using timing-safe comparison.
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const actualHash = scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(actualHash, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generates a high-entropy crypto session token.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates and registers a new session for a user.
 */
export function createSession(params: {
  userId: string;
  activeOrgId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Session {
  const token = generateSessionToken();
  const id = `sess_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

  // Determine active organization: specified or user's first active membership
  let orgId = params.activeOrgId;
  if (!orgId) {
    const firstMembership = Array.from(globalStore.memberships.values()).find(
      (m) => m.userId === params.userId && m.status === 'ACTIVE'
    );
    orgId = firstMembership ? firstMembership.orgId : 'org_apex';
  }

  const session: Session = {
    id,
    token,
    userId: params.userId,
    activeOrgId: orgId,
    createdAt: now.toISOString(),
    expiresAt,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  };

  globalStore.sessions.set(token, session);
  return session;
}

/**
 * Validates a session token and returns the session if valid and not expired.
 */
export function validateSessionToken(token: string): Session | null {
  if (!token) return null;
  const session = globalStore.sessions.get(token);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    globalStore.sessions.delete(token);
    return null;
  }

  return session;
}

/**
 * Revokes a session on logout.
 */
export function revokeSession(token: string): boolean {
  return globalStore.sessions.delete(token);
}

/**
 * Clean up expired sessions from memory and disk.
 */
export function pruneExpiredSessions(): number {
  const now = new Date();
  let pruned = 0;
  for (const [token, session] of globalStore.sessions.entries()) {
    if (new Date(session.expiresAt) < now) {
      globalStore.sessions.delete(token);
      pruned++;
    }
  }
  return pruned;
}

/**
 * Extract auth token from request headers or query.
 */
export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-session-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

/**
 * Express middleware to strictly enforce authentication and tenant isolation.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractAuthToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Authentication required. Provide a valid Bearer token in the Authorization header.',
    });
  }

  const session = validateSessionToken(token);
  if (!session) {
    return res.status(401).json({
      error: 'INVALID_SESSION',
      message: 'Session is invalid or has expired. Please log in again.',
    });
  }

  const user = globalStore.users.get(session.userId);
  if (!user) {
    return res.status(401).json({
      error: 'USER_NOT_FOUND',
      message: 'User associated with session no longer exists.',
    });
  }

  // Tenant isolation: Check requested org via header, fallback to session's activeOrgId
  const requestedOrgId = (req.headers['x-organization-id'] as string) || session.activeOrgId;
  const org = globalStore.organizations.get(requestedOrgId);
  if (!org) {
    return res.status(404).json({
      error: 'ORGANIZATION_NOT_FOUND',
      message: `Organization '${requestedOrgId}' does not exist.`,
    });
  }

  // Verify user has active membership in this organization
  const membership = Array.from(globalStore.memberships.values()).find(
    (m) => m.userId === user.id && m.orgId === org.id && m.status === 'ACTIVE'
  );

  if (!membership) {
    return res.status(403).json({
      error: 'TENANT_ACCESS_DENIED',
      message: `Access denied: User does not have an active membership in organization '${org.name}'. Cross-tenant access is prohibited.`,
    });
  }

  req.user = user;
  req.org = org;
  req.membership = membership;
  req.session = session;

  next();
}
