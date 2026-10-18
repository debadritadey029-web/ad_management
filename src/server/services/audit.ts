/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { AuditLogEntry, Role } from '../db/types.js';

export function computeAuditHash(entry: {
  prevHash: string;
  orgId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  details: Record<string, unknown>;
}): string {
  const content = `${entry.prevHash}|${entry.orgId}|${entry.actorUserId}|${entry.action}|${entry.entityType}|${entry.entityId}|${entry.timestamp}|${JSON.stringify(entry.details)}`;
  return createHash('sha256').update(content).digest('hex');
}

export function createAuditLogEntry(params: {
  orgId: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  prevHash?: string;
}): AuditLogEntry {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();
  const prevHash = params.prevHash || '0000000000000000000000000000000000000000000000000000000000000000';

  const hash = computeAuditHash({
    prevHash,
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    timestamp,
    details: params.details,
  });

  return {
    id,
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    timestamp,
    prevHash,
    hash,
  };
}

export function verifyAuditChain(entries: AuditLogEntry[]): { valid: boolean; brokenAtId?: string } {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrev = i === 0 ? '0000000000000000000000000000000000000000000000000000000000000000' : entries[i - 1].hash;
    if (entry.prevHash !== expectedPrev) {
      return { valid: false, brokenAtId: entry.id };
    }
    const computed = computeAuditHash({
      prevHash: entry.prevHash,
      orgId: entry.orgId,
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      timestamp: entry.timestamp,
      details: entry.details,
    });
    if (computed !== entry.hash) {
      return { valid: false, brokenAtId: entry.id };
    }
  }
  return { valid: true };
}
