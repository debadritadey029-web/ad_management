/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, canRemoveMember } from '../services/rbac.js';
import { Membership } from '../db/types.js';

test('RBAC: permissions match assigned role capabilities', () => {
  // Owner has full suite
  assert.equal(hasPermission('OWNER', 'MANAGE_ORGS'), true);
  assert.equal(hasPermission('OWNER', 'APPROVE_BUDGETS'), true);
  assert.equal(hasPermission('OWNER', 'TRIGGER_EMERGENCY_STOP'), true);

  // Campaign Manager can create campaigns and trigger emergency stop, but CANNOT approve budgets
  assert.equal(hasPermission('CAMPAIGN_MANAGER', 'CREATE_CAMPAIGNS'), true);
  assert.equal(hasPermission('CAMPAIGN_MANAGER', 'TRIGGER_EMERGENCY_STOP'), true);
  assert.equal(hasPermission('CAMPAIGN_MANAGER', 'APPROVE_BUDGETS'), false);

  // Read-only cannot edit or delete campaigns
  assert.equal(hasPermission('READ_ONLY', 'VIEW_ANALYTICS'), true);
  assert.equal(hasPermission('READ_ONLY', 'CREATE_CAMPAIGNS'), false);
  assert.equal(hasPermission('READ_ONLY', 'APPROVE_BUDGETS'), false);
});

test('RBAC: Last Owner Protection prevents removal of sole active owner', () => {
  const singleOwnerMembership: Membership = {
    id: 'mem_1',
    userId: 'usr_sarah',
    orgId: 'org_apex',
    role: 'OWNER',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00Z',
  };

  const result = canRemoveMember('OWNER', singleOwnerMembership, [singleOwnerMembership]);
  assert.equal(result.allowed, false);
  assert.ok(result.reason?.includes('LAST_OWNER_PROTECTION'));
});

test('RBAC: Non-owner cannot remove an owner', () => {
  const ownerMembership: Membership = {
    id: 'mem_1',
    userId: 'usr_sarah',
    orgId: 'org_apex',
    role: 'OWNER',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00Z',
  };

  const secondOwner: Membership = {
    id: 'mem_2',
    userId: 'usr_other',
    orgId: 'org_apex',
    role: 'OWNER',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00Z',
  };

  const result = canRemoveMember('ADMIN', ownerMembership, [ownerMembership, secondOwner]);
  assert.equal(result.allowed, false);
  assert.ok(result.reason?.includes('CANNOT_REMOVE_OWNER'));
});
