/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  createSession,
  validateSessionToken,
  revokeSession,
  generateSessionToken,
} from '../services/auth.js';

test('Auth: password hashing and verification with scrypt', () => {
  const password = 'EnterprisePassword2026!';
  const { salt, hash } = hashPassword(password);

  assert.ok(salt.length >= 32);
  assert.ok(hash.length >= 64);

  // Correct password verification
  assert.equal(verifyPassword(password, salt, hash), true);

  // Incorrect password rejection
  assert.equal(verifyPassword('WrongPassword123!', salt, hash), false);

  // Empty or tampered hash rejection
  assert.equal(verifyPassword(password, salt, '0000000000000000'), false);
});

test('Auth: session token creation, validation, and revocation', () => {
  const session = createSession({
    userId: 'usr_sarah',
    activeOrgId: 'org_apex',
    userAgent: 'IntegrationTestRunner/1.0',
    ipAddress: '127.0.0.1',
  });

  assert.ok(session.token);
  assert.equal(session.userId, 'usr_sarah');
  assert.equal(session.activeOrgId, 'org_apex');

  // Validate session token
  const retrieved = validateSessionToken(session.token);
  assert.ok(retrieved);
  assert.equal(retrieved?.userId, 'usr_sarah');

  // Invalidate session on logout
  const revoked = revokeSession(session.token);
  assert.equal(revoked, true);

  // Subsequent validation fails
  const afterRevoke = validateSessionToken(session.token);
  assert.equal(afterRevoke, null);
});

test('Auth: high-entropy session tokens are unique', () => {
  const token1 = generateSessionToken();
  const token2 = generateSessionToken();
  assert.notEqual(token1, token2);
  assert.equal(token1.length, 64);
});
