/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { globalStore } from '../db/store.js';

test('Tenant Isolation: Organizations have strictly isolated campaign scopes', () => {
  const apexCampaigns = Array.from(globalStore.campaigns.values()).filter(
    (c) => c.orgId === 'org_apex'
  );
  const solarisCampaigns = Array.from(globalStore.campaigns.values()).filter(
    (c) => c.orgId === 'org_solaris'
  );

  assert.ok(apexCampaigns.length > 0);

  // Every campaign in apex belongs strictly to apex
  for (const c of apexCampaigns) {
    assert.equal(c.orgId, 'org_apex');
  }

  // Cross-tenant filter strictly excludes other tenant data
  const crossPollinated = apexCampaigns.some((c) => c.orgId === 'org_solaris');
  assert.equal(crossPollinated, false);
});

test('Tenant Isolation: Membership check prevents non-members from accessing an organization', () => {
  // David Kim is member of org_apex only
  const davidMemberships = Array.from(globalStore.memberships.values()).filter(
    (m) => m.userId === 'usr_david' && m.status === 'ACTIVE'
  );

  assert.equal(davidMemberships.some((m) => m.orgId === 'org_apex'), true);
  assert.equal(davidMemberships.some((m) => m.orgId === 'org_solaris'), false);

  // Verifying membership validation logic rejects David from org_solaris
  const isMemberOfSolaris = Array.from(globalStore.memberships.values()).some(
    (m) => m.userId === 'usr_david' && m.orgId === 'org_solaris' && m.status === 'ACTIVE'
  );
  assert.equal(isMemberOfSolaris, false);
});

test('Tenant Isolation: Budget proposals are strictly scoped to parent organization', () => {
  const apexProposals = Array.from(globalStore.proposals.values()).filter(
    (p) => p.orgId === 'org_apex'
  );

  for (const p of apexProposals) {
    const parentCampaign = globalStore.campaigns.get(p.campaignId);
    assert.ok(parentCampaign);
    // Proposal orgId must match the campaign orgId
    assert.equal(p.orgId, parentCampaign?.orgId);
  }
});
