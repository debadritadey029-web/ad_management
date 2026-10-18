/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuditLogEntry, verifyAuditChain } from '../services/audit.js';

test('Audit Log: generates valid cryptographically chained entries', () => {
  const entry1 = createAuditLogEntry({
    orgId: 'org_apex',
    actorUserId: 'usr_sarah',
    actorEmail: 'sarah.jenkins@advantage-ai.enterprise',
    actorRole: 'OWNER',
    action: 'INIT',
    entityType: 'ORG',
    entityId: 'org_apex',
    details: { started: true },
  });

  const entry2 = createAuditLogEntry({
    orgId: 'org_apex',
    actorUserId: 'usr_priya',
    actorEmail: 'priya.sharma@advantage-ai.enterprise',
    actorRole: 'CAMPAIGN_MANAGER',
    action: 'CREATE_CAMPAIGN',
    entityType: 'CAMPAIGN',
    entityId: 'cmp_1',
    prevHash: entry1.hash,
    details: { name: 'Spring Promo' },
  });

  const verification = verifyAuditChain([entry1, entry2]);
  assert.equal(verification.valid, true);
});

test('Audit Log: detects tampering in previous entry details', () => {
  const entry1 = createAuditLogEntry({
    orgId: 'org_apex',
    actorUserId: 'usr_sarah',
    actorEmail: 'sarah.jenkins@advantage-ai.enterprise',
    actorRole: 'OWNER',
    action: 'INIT',
    entityType: 'ORG',
    entityId: 'org_apex',
    details: { started: true },
  });

  const entry2 = createAuditLogEntry({
    orgId: 'org_apex',
    actorUserId: 'usr_priya',
    actorEmail: 'priya.sharma@advantage-ai.enterprise',
    actorRole: 'CAMPAIGN_MANAGER',
    action: 'CREATE_CAMPAIGN',
    entityType: 'CAMPAIGN',
    entityId: 'cmp_1',
    prevHash: entry1.hash,
    details: { name: 'Spring Promo' },
  });

  // Tamper with entry 1
  entry1.details = { started: false, tampered: true };

  const verification = verifyAuditChain([entry1, entry2]);
  assert.equal(verification.valid, false);
  assert.equal(verification.brokenAtId, entry1.id);
});
