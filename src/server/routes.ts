/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { globalStore } from './db/store.js';
import { evaluateBudgetPolicy, toMinorUnits, fromMinorUnits, formatCurrency, calculateMarketingMetrics } from './services/finance.js';
import { hasPermission, canRemoveMember, ROLE_PERMISSIONS } from './services/rbac.js';
import { createAuditLogEntry, verifyAuditChain } from './services/audit.js';
import { askCopilot } from './services/copilot.js';
import { PROVIDER_CATALOG, validateCreativeForProvider, validateCampaignMinBudget } from './services/providers/index.js';
import { PostgresAdapter } from './db/postgres.js';
import { Campaign, BudgetProposal, CreativeAsset, LeadRecord } from './db/types.js';

export const apiRouter = Router();

// Current active session context (in a real production app, extracted from signed JWT/session cookie)
let currentUserId = 'usr_sarah'; // Default Sarah Jenkins (Owner)
let currentOrgId = 'org_apex';   // Default Apex Global Commerce

// Helper to get active user & org
function getContext() {
  const user = globalStore.users.get(currentUserId)!;
  const org = globalStore.organizations.get(currentOrgId)!;
  const membership = Array.from(globalStore.memberships.values()).find(
    (m) => m.userId === currentUserId && m.orgId === currentOrgId && m.status === 'ACTIVE'
  );
  return { user, org, membership };
}

// 1. Auth & Context
apiRouter.get('/auth/context', (req: Request, res: Response) => {
  const { user, org, membership } = getContext();
  const allUsers = Array.from(globalStore.users.values());
  const allOrgs = Array.from(globalStore.organizations.values());
  const userMemberships = Array.from(globalStore.memberships.values()).filter(
    (m) => m.userId === currentUserId
  );

  res.json({
    user,
    currentOrg: org,
    membership,
    permissions: membership ? ROLE_PERMISSIONS[membership.role] : [],
    availableUsers: allUsers,
    availableOrgs: allOrgs,
    userMemberships,
  });
});

apiRouter.post('/auth/switch-context', (req: Request, res: Response) => {
  const { userId, orgId } = req.body;
  if (userId && globalStore.users.has(userId)) {
    currentUserId = userId;
  }
  if (orgId && globalStore.organizations.has(orgId)) {
    currentOrgId = orgId;
  }
  const ctx = getContext();
  res.json({ success: true, ...ctx });
});

// 2. Organizations
apiRouter.get('/organizations', (req: Request, res: Response) => {
  res.json(Array.from(globalStore.organizations.values()));
});

apiRouter.patch('/organizations/settings', (req: Request, res: Response) => {
  const { org, user, membership } = getContext();
  if (!membership || !hasPermission(membership.role, 'MANAGE_ORGS')) {
    return res.status(403).json({ error: 'Permission denied: Requires MANAGE_ORGS permission.' });
  }

  const { budgetApprovalThresholdMinorUnits, dailySpendCeilingMinorUnits, requireFourEyesApproval, brandSafetyStrictness } = req.body;

  if (budgetApprovalThresholdMinorUnits !== undefined) {
    org.settings.budgetChangeApprovalThresholdMinorUnits = Number(budgetApprovalThresholdMinorUnits);
  }
  if (dailySpendCeilingMinorUnits !== undefined) {
    org.settings.dailySpendCeilingMinorUnits = Number(dailySpendCeilingMinorUnits);
  }
  if (requireFourEyesApproval !== undefined) {
    org.settings.requireFourEyesApproval = Boolean(requireFourEyesApproval);
  }
  if (brandSafetyStrictness) {
    org.settings.brandSafetyStrictness = brandSafetyStrictness;
  }

  // Audit log
  const prevLog = globalStore.auditLogs[globalStore.auditLogs.length - 1];
  const log = createAuditLogEntry({
    orgId: org.id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: membership.role,
    action: 'ORGANIZATION_SETTINGS_UPDATED',
    entityType: 'ORGANIZATION',
    entityId: org.id,
    prevHash: prevLog?.hash,
    details: req.body,
  });
  globalStore.auditLogs.push(log);

  res.json({ success: true, org });
});

// 3. Campaigns
apiRouter.get('/campaigns', (req: Request, res: Response) => {
  const { org } = getContext();
  const campaigns = Array.from(globalStore.campaigns.values()).filter((c) => c.orgId === org.id);
  res.json(campaigns);
});

apiRouter.post('/campaigns', (req: Request, res: Response) => {
  const { org, user, membership } = getContext();
  if (!membership || !hasPermission(membership.role, 'CREATE_CAMPAIGNS')) {
    return res.status(403).json({ error: 'Permission denied: Requires CREATE_CAMPAIGNS permission.' });
  }

  if (org.emergencyStopActive) {
    return res.status(403).json({ error: 'Emergency Stop is active! All campaign creation is halted.' });
  }

  const {
    name,
    provider,
    providerAccountId,
    objective,
    budgetType,
    budgetAmount,
    currency,
    startDate,
    endDate,
    targeting,
  } = req.body;

  const campCurrency = currency || org.defaultCurrency;
  const budgetMinorUnits = toMinorUnits(Number(budgetAmount), campCurrency);

  // Validate provider minimum budget
  const minValidation = validateCampaignMinBudget(provider, budgetMinorUnits, campCurrency);
  if (!minValidation.valid) {
    return res.status(400).json({ error: minValidation.error });
  }

  // Check against org daily ceiling
  if (budgetMinorUnits > org.settings.dailySpendCeilingMinorUnits) {
    return res.status(400).json({
      error: `Budget exceeds organization daily ceiling of ${formatCurrency(org.settings.dailySpendCeilingMinorUnits, campCurrency)}.`,
    });
  }

  const id = `cmp_${provider}_${Date.now()}`;
  const newCampaign: Campaign = {
    id,
    orgId: org.id,
    provider,
    providerAccountId: providerAccountId || 'act_default',
    name,
    objective: objective || 'CONVERSIONS',
    status: 'ACTIVE',
    budgetType: budgetType || 'DAILY',
    budgetMinorUnits,
    currency: campCurrency,
    startDate: startDate || new Date().toISOString(),
    endDate,
    targeting: targeting || {
      locations: ['United States'],
      ageMin: 18,
      ageMax: 65,
      genders: ['ALL'],
    },
    adGroupCount: 1,
    creativeIds: [],
    actualSpendMinorUnits: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenueMinorUnits: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  globalStore.campaigns.set(id, newCampaign);

  // Audit
  const prevLog = globalStore.auditLogs[globalStore.auditLogs.length - 1];
  const log = createAuditLogEntry({
    orgId: org.id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: membership.role,
    action: 'CAMPAIGN_CREATED',
    entityType: 'CAMPAIGN',
    entityId: id,
    prevHash: prevLog?.hash,
    details: { name, provider, budgetMinorUnits, currency: campCurrency },
  });
  globalStore.auditLogs.push(log);

  res.status(201).json(newCampaign);
});

apiRouter.patch('/campaigns/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const { org, user, membership } = getContext();

  if (!membership || !hasPermission(membership.role, 'EDIT_CAMPAIGNS')) {
    return res.status(403).json({ error: 'Permission denied: Requires EDIT_CAMPAIGNS permission.' });
  }

  const campaign = globalStore.campaigns.get(id);
  if (!campaign || campaign.orgId !== org.id) {
    return res.status(404).json({ error: 'Campaign not found.' });
  }

  if (org.emergencyStopActive && (status === 'ACTIVE' || status === 'PENDING_APPROVAL')) {
    return res.status(403).json({ error: 'Emergency Stop is active! Cannot activate campaigns.' });
  }

  const oldStatus = campaign.status;
  campaign.status = status;
  campaign.version += 1;
  campaign.updatedAt = new Date().toISOString();

  // Audit
  const prevLog = globalStore.auditLogs[globalStore.auditLogs.length - 1];
  const log = createAuditLogEntry({
    orgId: org.id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: membership.role,
    action: 'CAMPAIGN_STATUS_UPDATED',
    entityType: 'CAMPAIGN',
    entityId: id,
    prevHash: prevLog?.hash,
    details: { oldStatus, newStatus: status, version: campaign.version },
  });
  globalStore.auditLogs.push(log);

  res.json(campaign);
});

// 4. Financial Safety & Budget Proposals
apiRouter.get('/finance/proposals', (req: Request, res: Response) => {
  const { org } = getContext();
  const proposals = Array.from(globalStore.proposals.values()).filter((p) => p.orgId === org.id);
  res.json(proposals);
});

apiRouter.post('/finance/proposals', (req: Request, res: Response) => {
  const { org, user, membership } = getContext();
  if (!membership || !hasPermission(membership.role, 'EDIT_CAMPAIGNS')) {
    return res.status(403).json({ error: 'Permission denied: Requires EDIT_CAMPAIGNS permission.' });
  }

  const { campaignId, proposedBudgetAmount, title, description, reason } = req.body;
  const campaign = globalStore.campaigns.get(campaignId);

  if (!campaign || campaign.orgId !== org.id) {
    return res.status(404).json({ error: 'Target campaign not found.' });
  }

  const proposedBudgetMinorUnits = toMinorUnits(Number(proposedBudgetAmount), campaign.currency);

  const policyCheck = evaluateBudgetPolicy({
    currentBudgetMinorUnits: campaign.budgetMinorUnits,
    proposedBudgetMinorUnits,
    currency: campaign.currency,
    thresholdMinorUnits: org.settings.budgetChangeApprovalThresholdMinorUnits,
    dailyCeilingMinorUnits: org.settings.dailySpendCeilingMinorUnits,
    requesterUserId: user.id,
    emergencyStopActive: org.emergencyStopActive,
    campaignVersion: campaign.version,
    proposalCampaignVersion: campaign.version,
  });

  if (!policyCheck.allowed) {
    return res.status(400).json({ error: policyCheck.reasons.join(', ') });
  }

  const id = `prp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const proposal: BudgetProposal = {
    id,
    orgId: org.id,
    campaignId,
    type: proposedBudgetMinorUnits > campaign.budgetMinorUnits ? 'BUDGET_INCREASE' : 'BUDGET_DECREASE',
    title: title || `Budget adjustment for ${campaign.name}`,
    description: description || `Request to adjust budget to ${formatCurrency(proposedBudgetMinorUnits, campaign.currency)}.`,
    requestedByUserId: user.id,
    requestedAt: new Date().toISOString(),
    status: 'PENDING',
    currentBudgetMinorUnits: campaign.budgetMinorUnits,
    proposedBudgetMinorUnits,
    currency: campaign.currency,
    reason: reason || 'Optimization and pacing adjustment.',
    campaignVersionAtRequest: campaign.version,
  };

  globalStore.proposals.set(id, proposal);

  // Audit
  const prevLog = globalStore.auditLogs[globalStore.auditLogs.length - 1];
  const log = createAuditLogEntry({
    orgId: org.id,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: membership.role,
    action: 'BUDGET_PROPOSAL_CREATED',
    entityType: 'PROPOSAL',
    entityId: id,
    prevHash: prevLog?.hash,
    details: {
      campaignId,
      currentBudget: campaign.budgetMinorUnits,
      proposedBudget: proposedBudgetMinorUnits,
    },
  });
  globalStore.auditLogs.push(log);

  res.status(201).json(proposal);
});

apiRouter.post('/finance/proposals/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, notes } = req.body; // action: 'APPROVE' | 'REJECT'
  const { org, user, membership } = getContext();

  if (!membership || !hasPermission(membership.role, 'APPROVE_BUDGETS')) {
    return res.status(403).json({ error: 'Permission denied: Requires APPROVE_BUDGETS permission.' });
  }

  const proposal = globalStore.proposals.get(id);
  if (!proposal || proposal.orgId !== org.id) {
    return res.status(404).json({ error: 'Proposal not found.' });
  }

  if (proposal.status !== 'PENDING') {
    return res.status(400).json({ error: `Proposal already processed (status: ${proposal.status}).` });
  }

  const campaign = globalStore.campaigns.get(proposal.campaignId);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign associated with proposal not found.' });
  }

  // Four-eye separation of duties check
  if (org.settings.requireFourEyesApproval && proposal.requestedByUserId === user.id) {
    return res.status(403).json({
      error: 'Four-Eyes Principle Violation: Requester cannot approve their own financial proposal.',
    });
  }

  // Emergency stop check
  if (org.emergencyStopActive) {
    return res.status(403).json({
      error: 'Emergency Stop is active: No financial proposals can be executed.',
    });
  }

  // Stale check
  if (campaign.version !== proposal.campaignVersionAtRequest) {
    proposal.status = 'STALE';
    proposal.reviewNotes = `Proposal marked STALE because campaign version changed from ${proposal.campaignVersionAtRequest} to ${campaign.version}.`;
    return res.status(409).json({
      error: 'Proposal is stale! Campaign was modified after proposal was submitted. Re-submission required.',
      proposal,
    });
  }

  if (action === 'APPROVE') {
    proposal.status = 'EXECUTED';
    proposal.reviewedByUserId = user.id;
    proposal.reviewedAt = new Date().toISOString();
    proposal.reviewNotes = notes || 'Approved and executed by finance authority.';

    // Execute change on campaign
    campaign.budgetMinorUnits = proposal.proposedBudgetMinorUnits;
    campaign.version += 1;
    campaign.updatedAt = new Date().toISOString();

    const prevLog = globalStore.auditLogs[globalStore.auditLogs.length - 1];
    const log = createAuditLogEntry({
      orgId: org.id,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'BUDGET_PROPOSAL_APPROVED_AND_EXECUTED',
      entityType: 'PROPOSAL',
      entityId: id,
      prevHash: prevLog?.hash,
      details: {
        campaignId: campaign.id,
        newBudgetMinorUnits: campaign.budgetMinorUnits,
        approverId: user.id,
      },
    });
    globalStore.auditLogs.push(log);
  } else {
    proposal.status = 'REJECTED';
    proposal.reviewedByUserId = user.id;
    proposal.reviewedAt = new Date().toISOString();
    proposal.reviewNotes = notes || 'Rejected during financial review.';

    const prevLog = globalStore.auditLogs[globalStore.auditLogs.length - 1];
    const log = createAuditLogEntry({
      orgId: org.id,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'BUDGET_PROPOSAL_REJECTED',
      entityType: 'PROPOSAL',
      entityId: id,
      prevHash: prevLog?.hash,
      details: { notes },
    });
    globalStore.auditLogs.push(log);
  }

  res.json(proposal);
});

// 5. Emergency Stop Killswitch
apiRouter.post('/finance/emergency-stop', (req: Request, res: Response) => {
  const { action, reason } = req.body; // action: 'TRIGGER' | 'RELEASE'
  const { org, user, membership } = getContext();

  const reqPerm = action === 'TRIGGER' ? 'TRIGGER_EMERGENCY_STOP' : 'RELEASE_EMERGENCY_STOP';
  if (!membership || !hasPermission(membership.role, reqPerm)) {
    return res.status(403).json({ error: `Permission denied: Requires ${reqPerm}.` });
  }

  if (action === 'TRIGGER') {
    org.emergencyStopActive = true;
    org.emergencyStopReason = reason || 'Immediate operational containment requested.';
    org.emergencyStopTriggeredAt = new Date().toISOString();
    org.emergencyStopTriggeredBy = user.name;

    // Pause all active campaigns in org as precaution
    let pausedCount = 0;
    for (const cmp of globalStore.campaigns.values()) {
      if (cmp.orgId === org.id && cmp.status === 'ACTIVE') {
        cmp.status = 'PAUSED';
        cmp.version += 1;
        pausedCount++;
      }
    }

    const prevLog = globalStore.auditLogs[globalStore.auditLogs.length - 1];
    const log = createAuditLogEntry({
      orgId: org.id,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'EMERGENCY_STOP_TRIGGERED',
      entityType: 'ORGANIZATION',
      entityId: org.id,
      prevHash: prevLog?.hash,
      details: { reason, pausedCampaignsCount: pausedCount },
    });
    globalStore.auditLogs.push(log);

    res.json({
      success: true,
      message: 'EMERGENCY STOP ACTIVATED: All provider write actions halted and active campaigns paused.',
      org,
    });
  } else {
    org.emergencyStopActive = false;
    org.emergencyStopReason = undefined;

    const prevLog = globalStore.auditLogs[globalStore.auditLogs.length - 1];
    const log = createAuditLogEntry({
      orgId: org.id,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: membership.role,
      action: 'EMERGENCY_STOP_RELEASED',
      entityType: 'ORGANIZATION',
      entityId: org.id,
      prevHash: prevLog?.hash,
      details: { releasedBy: user.email },
    });
    globalStore.auditLogs.push(log);

    res.json({
      success: true,
      message: 'Emergency Stop released. Normal operational safeguards restored.',
      org,
    });
  }
});

// 6. Provider Connectors
apiRouter.get('/providers', (req: Request, res: Response) => {
  const { org } = getContext();
  const connections = Array.from(globalStore.providerConnections.values()).filter(
    (c) => c.orgId === org.id
  );
  res.json({
    catalog: PROVIDER_CATALOG,
    connections,
  });
});

apiRouter.post('/providers/:id/sync', (req: Request, res: Response) => {
  const { id } = req.params;
  const { org } = getContext();
  const conn = globalStore.providerConnections.get(id);

  if (!conn || conn.orgId !== org.id) {
    return res.status(404).json({ error: 'Connection not found.' });
  }

  conn.syncStatus = 'HEALTHY';
  conn.lastSyncAt = new Date().toISOString();
  res.json({ success: true, connection: conn });
});

// 7. Analytics & Reporting
apiRouter.get('/analytics', (req: Request, res: Response) => {
  const { org } = getContext();
  const campaigns = Array.from(globalStore.campaigns.values()).filter((c) => c.orgId === org.id);

  let totalSpendMinorUnits = 0;
  let totalRevenueMinorUnits = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;

  const platformBreakdown: Record<string, { spend: number; revenue: number; clicks: number; conversions: number }> = {};

  campaigns.forEach((c) => {
    totalSpendMinorUnits += c.actualSpendMinorUnits;
    totalRevenueMinorUnits += c.revenueMinorUnits;
    totalImpressions += c.impressions;
    totalClicks += c.clicks;
    totalConversions += c.conversions;

    if (!platformBreakdown[c.provider]) {
      platformBreakdown[c.provider] = { spend: 0, revenue: 0, clicks: 0, conversions: 0 };
    }
    platformBreakdown[c.provider].spend += fromMinorUnits(c.actualSpendMinorUnits, c.currency);
    platformBreakdown[c.provider].revenue += fromMinorUnits(c.revenueMinorUnits, c.currency);
    platformBreakdown[c.provider].clicks += c.clicks;
    platformBreakdown[c.provider].conversions += c.conversions;
  });

  const metrics = calculateMarketingMetrics({
    spendMinorUnits: totalSpendMinorUnits,
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
    revenueMinorUnits: totalRevenueMinorUnits,
    currency: org.defaultCurrency,
  });

  res.json({
    totals: metrics,
    currency: org.defaultCurrency,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'ACTIVE').length,
    platformBreakdown,
    attributionWindow: '7-day click, 1-day view (Verified Cross-Channel)',
    freshnessTimestamp: new Date().toISOString(),
  });
});

// 8. AI Advertising Copilot
apiRouter.post('/copilot/query', async (req: Request, res: Response) => {
  const { prompt, language } = req.body;
  const { org } = getContext();
  const campaigns = Array.from(globalStore.campaigns.values()).filter((c) => c.orgId === org.id);
  const brand = Array.from(globalStore.brandProfiles.values()).find((b) => b.orgId === org.id);

  try {
    const result = await askCopilot({
      userPrompt: prompt || '',
      org,
      campaigns,
      brand,
      language: language || 'en',
    });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({
      error: 'Copilot query execution error',
      details: String(err),
    });
  }
});

// 9. Creatives & Brand Studio
apiRouter.get('/creatives', (req: Request, res: Response) => {
  const { org } = getContext();
  const creatives = Array.from(globalStore.creatives.values()).filter((c) => c.orgId === org.id);
  const brandProfiles = Array.from(globalStore.brandProfiles.values()).filter((b) => b.orgId === org.id);
  res.json({ creatives, brandProfiles });
});

apiRouter.post('/creatives', (req: Request, res: Response) => {
  const { org, user, membership } = getContext();
  if (!membership || !hasPermission(membership.role, 'MANAGE_CREATIVES')) {
    return res.status(403).json({ error: 'Permission denied: Requires MANAGE_CREATIVES permission.' });
  }

  const { name, headline, description, callToAction, targetUrl, platformFormats, language, imageUrl } = req.body;

  // Validate format constraints
  const errors: string[] = [];
  (platformFormats || ['meta']).forEach((p: any) => {
    const v = validateCreativeForProvider(p, headline || '', description || '');
    if (!v.valid) {
      errors.push(...v.errors);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  // Calculate brand safety score
  const brand = Array.from(globalStore.brandProfiles.values()).find((b) => b.orgId === org.id);
  const brandNotes: string[] = [];
  let score = 100;

  if (brand) {
    for (const badWord of brand.disallowedKeywords) {
      if (
        (headline && headline.toLowerCase().includes(badWord.toLowerCase())) ||
        (description && description.toLowerCase().includes(badWord.toLowerCase()))
      ) {
        score -= 30;
        brandNotes.push(`Disallowed keyword found: "${badWord}"`);
      }
    }
  }

  const id = `crt_${Date.now()}`;
  const newAsset: CreativeAsset = {
    id,
    orgId: org.id,
    name: name || 'Untitled Asset',
    brandProfileId: brand?.id || 'default_brand',
    headline,
    description,
    callToAction: callToAction || 'LEARN_MORE',
    targetUrl: targetUrl || 'https://example.com',
    platformFormats: platformFormats || ['meta'],
    language: language || 'en',
    status: score >= 80 ? 'APPROVED' : 'IN_REVIEW',
    brandSafetyScore: Math.max(0, score),
    brandSafetyNotes: brandNotes.length > 0 ? brandNotes : ['Brand guidelines verified.'],
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
    createdAt: new Date().toISOString(),
  };

  globalStore.creatives.set(id, newAsset);
  res.status(201).json(newAsset);
});

// 10. Leads & Messaging Module
apiRouter.get('/leads', (req: Request, res: Response) => {
  const { org } = getContext();
  const leads = Array.from(globalStore.leads.values()).filter((l) => l.orgId === org.id);
  res.json(leads);
});

apiRouter.patch('/leads/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const { org } = getContext();
  const lead = globalStore.leads.get(id);

  if (!lead || lead.orgId !== org.id) {
    return res.status(404).json({ error: 'Lead not found.' });
  }

  lead.status = status;
  res.json(lead);
});

// 11. Audit Logs & Chain Verification
apiRouter.get('/audit', (req: Request, res: Response) => {
  const { org } = getContext();
  const logs = globalStore.auditLogs.filter((l) => l.orgId === org.id);
  const chainVerification = verifyAuditChain(logs);
  res.json({
    logs: [...logs].reverse(),
    chainVerification,
  });
});

// 12. PostgreSQL & System Health
apiRouter.get('/health', (req: Request, res: Response) => {
  const pgAdapter = new PostgresAdapter();
  res.json({
    status: 'ONLINE',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    postgresStatus: pgAdapter.getStatus(),
    memoryStoreCounts: {
      organizations: globalStore.organizations.size,
      users: globalStore.users.size,
      campaigns: globalStore.campaigns.size,
      proposals: globalStore.proposals.size,
      creatives: globalStore.creatives.size,
      leads: globalStore.leads.size,
      auditLogs: globalStore.auditLogs.length,
    },
  });
});
