/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Role, Permission, Membership } from '../db/types.js';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    'MANAGE_ORGS',
    'INVITE_MEMBERS',
    'MANAGE_ROLES',
    'CREATE_CAMPAIGNS',
    'EDIT_CAMPAIGNS',
    'DELETE_CAMPAIGNS',
    'APPROVE_BUDGETS',
    'TRIGGER_EMERGENCY_STOP',
    'RELEASE_EMERGENCY_STOP',
    'EXECUTE_PROVIDER_WRITES',
    'CONNECT_PROVIDERS',
    'VIEW_ANALYTICS',
    'EXPORT_DATA',
    'MANAGE_CREATIVES',
    'MANAGE_LEADS',
    'USE_COPILOT',
    'VIEW_AUDIT_LOGS',
  ],
  ADMIN: [
    'MANAGE_ORGS',
    'INVITE_MEMBERS',
    'MANAGE_ROLES',
    'CREATE_CAMPAIGNS',
    'EDIT_CAMPAIGNS',
    'DELETE_CAMPAIGNS',
    'APPROVE_BUDGETS',
    'TRIGGER_EMERGENCY_STOP',
    'RELEASE_EMERGENCY_STOP',
    'EXECUTE_PROVIDER_WRITES',
    'CONNECT_PROVIDERS',
    'VIEW_ANALYTICS',
    'EXPORT_DATA',
    'MANAGE_CREATIVES',
    'MANAGE_LEADS',
    'USE_COPILOT',
    'VIEW_AUDIT_LOGS',
  ],
  CAMPAIGN_MANAGER: [
    'CREATE_CAMPAIGNS',
    'EDIT_CAMPAIGNS',
    'TRIGGER_EMERGENCY_STOP',
    'VIEW_ANALYTICS',
    'EXPORT_DATA',
    'MANAGE_CREATIVES',
    'MANAGE_LEADS',
    'USE_COPILOT',
  ],
  FINANCE_APPROVER: [
    'APPROVE_BUDGETS',
    'TRIGGER_EMERGENCY_STOP',
    'RELEASE_EMERGENCY_STOP',
    'VIEW_ANALYTICS',
    'EXPORT_DATA',
    'VIEW_AUDIT_LOGS',
  ],
  ANALYST: [
    'VIEW_ANALYTICS',
    'EXPORT_DATA',
    'USE_COPILOT',
    'VIEW_AUDIT_LOGS',
  ],
  CREATIVE: [
    'MANAGE_CREATIVES',
    'VIEW_ANALYTICS',
    'USE_COPILOT',
  ],
  OPERATOR: [
    'VIEW_ANALYTICS',
    'MANAGE_LEADS',
    'TRIGGER_EMERGENCY_STOP',
  ],
  READ_ONLY: [
    'VIEW_ANALYTICS',
    'VIEW_AUDIT_LOGS',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions && permissions.includes(permission));
}

export function canRemoveMember(
  actorRole: Role,
  targetMembership: Membership,
  allActiveOrgMemberships: Membership[]
): { allowed: boolean; reason?: string } {
  if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
    return { allowed: false, reason: 'INSUFFICIENT_PERMISSIONS: Only Owner or Admin can remove members.' };
  }

  if (targetMembership.role === 'OWNER') {
    if (actorRole !== 'OWNER') {
      return { allowed: false, reason: 'CANNOT_REMOVE_OWNER: Only an Owner can remove an Owner.' };
    }
    const activeOwners = allActiveOrgMemberships.filter(
      (m) => m.role === 'OWNER' && m.status === 'ACTIVE'
    );
    if (activeOwners.length <= 1) {
      return {
        allowed: false,
        reason: 'LAST_OWNER_PROTECTION: Cannot remove the last active Owner of an organization.',
      };
    }
  }

  return { allowed: true };
}
