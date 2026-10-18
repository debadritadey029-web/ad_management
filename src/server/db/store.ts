/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Organization,
  Membership,
  Invitation,
  ProviderConnection,
  Campaign,
  BudgetProposal,
  CreativeAsset,
  BrandProfile,
  LeadRecord,
  AuditLogEntry,
} from './types.js';
import { createAuditLogEntry } from '../services/audit.js';

export interface DataStore {
  users: Map<string, User>;
  organizations: Map<string, Organization>;
  memberships: Map<string, Membership>;
  invitations: Map<string, Invitation>;
  providerConnections: Map<string, ProviderConnection>;
  campaigns: Map<string, Campaign>;
  proposals: Map<string, BudgetProposal>;
  creatives: Map<string, CreativeAsset>;
  brandProfiles: Map<string, BrandProfile>;
  leads: Map<string, LeadRecord>;
  auditLogs: AuditLogEntry[];
}

export function initializeStore(): DataStore {
  const store: DataStore = {
    users: new Map(),
    organizations: new Map(),
    memberships: new Map(),
    invitations: new Map(),
    providerConnections: new Map(),
    campaigns: new Map(),
    proposals: new Map(),
    creatives: new Map(),
    brandProfiles: new Map(),
    leads: new Map(),
    auditLogs: [],
  };

  // 1. Users
  const users: User[] = [
    {
      id: 'usr_sarah',
      email: 'sarah.jenkins@advantage-ai.enterprise',
      name: 'Sarah Jenkins',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'usr_marcus',
      email: 'marcus.vance@advantage-ai.enterprise',
      name: 'Marcus Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      createdAt: '2026-01-10T08:05:00Z',
    },
    {
      id: 'usr_priya',
      email: 'priya.sharma@advantage-ai.enterprise',
      name: 'Priya Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      createdAt: '2026-01-12T09:30:00Z',
    },
    {
      id: 'usr_alex',
      email: 'alex.rivera@advantage-ai.enterprise',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: '2026-01-15T11:00:00Z',
    },
    {
      id: 'usr_david',
      email: 'david.kim@advantage-ai.enterprise',
      name: 'David Kim',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      createdAt: '2026-01-20T14:00:00Z',
    },
  ];
  users.forEach((u) => store.users.set(u.id, u));

  // 2. Organizations
  const orgApex: Organization = {
    id: 'org_apex',
    name: 'Apex Global Commerce',
    slug: 'apex-global',
    tier: 'ENTERPRISE',
    defaultCurrency: 'USD',
    emergencyStopActive: false,
    settings: {
      budgetChangeApprovalThresholdMinorUnits: 50000, // $500.00
      dailySpendCeilingMinorUnits: 2500000, // $25,000.00
      monthlySpendCeilingMinorUnits: 50000000, // $500,000.00
      requireFourEyesApproval: true,
      brandSafetyStrictness: 'STRICT',
    },
    createdAt: '2026-01-10T08:00:00Z',
  };

  const orgSolaris: Organization = {
    id: 'org_solaris',
    name: 'Solaris Cloud Software',
    slug: 'solaris-cloud',
    tier: 'GROWTH',
    defaultCurrency: 'EUR',
    emergencyStopActive: false,
    settings: {
      budgetChangeApprovalThresholdMinorUnits: 30000, // €300.00
      dailySpendCeilingMinorUnits: 1000000, // €10,000.00
      monthlySpendCeilingMinorUnits: 20000000, // €200,000.00
      requireFourEyesApproval: true,
      brandSafetyStrictness: 'STANDARD',
    },
    createdAt: '2026-02-01T10:00:00Z',
  };

  const orgZenith: Organization = {
    id: 'org_zenith',
    name: 'Zenith Media APAC',
    slug: 'zenith-apac',
    tier: 'ENTERPRISE',
    defaultCurrency: 'INR',
    emergencyStopActive: false,
    settings: {
      budgetChangeApprovalThresholdMinorUnits: 4000000, // ₹40,000.00
      dailySpendCeilingMinorUnits: 200000000, // ₹20,00,000.00
      monthlySpendCeilingMinorUnits: 5000000000, // ₹5,00,00,000.00
      requireFourEyesApproval: true,
      brandSafetyStrictness: 'STRICT',
    },
    createdAt: '2026-02-15T10:00:00Z',
  };

  [orgApex, orgSolaris, orgZenith].forEach((org) => store.organizations.set(org.id, org));

  // 3. Memberships
  const memberships: Membership[] = [
    { id: 'mem_1', userId: 'usr_sarah', orgId: 'org_apex', role: 'OWNER', status: 'ACTIVE', joinedAt: '2026-01-10T08:00:00Z' },
    { id: 'mem_2', userId: 'usr_marcus', orgId: 'org_apex', role: 'FINANCE_APPROVER', status: 'ACTIVE', joinedAt: '2026-01-10T08:05:00Z' },
    { id: 'mem_3', userId: 'usr_priya', orgId: 'org_apex', role: 'CAMPAIGN_MANAGER', status: 'ACTIVE', joinedAt: '2026-01-12T09:30:00Z' },
    { id: 'mem_4', userId: 'usr_alex', orgId: 'org_apex', role: 'CREATIVE', status: 'ACTIVE', joinedAt: '2026-01-15T11:00:00Z' },
    { id: 'mem_5', userId: 'usr_david', orgId: 'org_apex', role: 'ANALYST', status: 'ACTIVE', joinedAt: '2026-01-20T14:00:00Z' },

    // Cross-tenant membership for Sarah in Solaris
    { id: 'mem_6', userId: 'usr_sarah', orgId: 'org_solaris', role: 'ADMIN', status: 'ACTIVE', joinedAt: '2026-02-01T10:00:00Z' },
    { id: 'mem_7', userId: 'usr_marcus', orgId: 'org_solaris', role: 'FINANCE_APPROVER', status: 'ACTIVE', joinedAt: '2026-02-01T10:00:00Z' },
  ];
  memberships.forEach((m) => store.memberships.set(m.id, m));

  // 4. Provider Connections for Apex
  const connections: ProviderConnection[] = [
    {
      id: 'conn_meta_apex',
      orgId: 'org_apex',
      provider: 'meta',
      accountId: 'act_2948102948',
      accountName: 'Apex Global Meta Official (FB/IG)',
      status: 'CONNECTED',
      environment: 'PRODUCTION',
      capabilities: {
        canReadCampaigns: true,
        canWriteCampaigns: true,
        canReadMetrics: true,
        supportsWebhooks: true,
        supportsLeads: true,
      },
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      syncStatus: 'HEALTHY',
      apiQuotaUsedPercent: 34,
    },
    {
      id: 'conn_google_apex',
      orgId: 'org_apex',
      provider: 'google',
      accountId: '984-210-9481',
      accountName: 'Apex Global Performance Max & Search',
      status: 'CONNECTED',
      environment: 'PRODUCTION',
      capabilities: {
        canReadCampaigns: true,
        canWriteCampaigns: true,
        canReadMetrics: true,
        supportsWebhooks: true,
        supportsLeads: true,
      },
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      syncStatus: 'HEALTHY',
      apiQuotaUsedPercent: 48,
    },
    {
      id: 'conn_tiktok_apex',
      orgId: 'org_apex',
      provider: 'tiktok',
      accountId: 'tt_adv_8391024',
      accountName: 'Apex Spark & Video Ads (TikTok)',
      status: 'CONNECTED',
      environment: 'PRODUCTION',
      capabilities: {
        canReadCampaigns: true,
        canWriteCampaigns: true,
        canReadMetrics: true,
        supportsWebhooks: true,
        supportsLeads: true,
      },
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      syncStatus: 'HEALTHY',
      apiQuotaUsedPercent: 21,
    },
    {
      id: 'conn_linkedin_apex',
      orgId: 'org_apex',
      provider: 'linkedin',
      accountId: 'li_corp_591029',
      accountName: 'Apex Enterprise B2B Sponsored Content',
      status: 'CONNECTED',
      environment: 'PRODUCTION',
      capabilities: {
        canReadCampaigns: true,
        canWriteCampaigns: true,
        canReadMetrics: true,
        supportsWebhooks: false,
        supportsLeads: true,
      },
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      syncStatus: 'HEALTHY',
      apiQuotaUsedPercent: 18,
    },
    {
      id: 'conn_microsoft_apex',
      orgId: 'org_apex',
      provider: 'microsoft',
      accountId: 'ms_ads_109284',
      accountName: 'Apex Bing Search Network',
      status: 'SANDBOX',
      environment: 'SANDBOX',
      capabilities: {
        canReadCampaigns: true,
        canWriteCampaigns: false,
        canReadMetrics: true,
        supportsWebhooks: false,
        supportsLeads: false,
      },
      lastSyncAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      syncStatus: 'HEALTHY',
      apiQuotaUsedPercent: 5,
    },
  ];
  connections.forEach((c) => store.providerConnections.set(c.id, c));

  // 5. Campaigns
  const campaigns: Campaign[] = [
    {
      id: 'cmp_meta_spring',
      orgId: 'org_apex',
      provider: 'meta',
      providerAccountId: 'act_2948102948',
      providerCampaignId: 'meta_cmp_294019284',
      name: 'Spring Retargeting & High-Intent Cart Abandoners',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      budgetType: 'DAILY',
      budgetMinorUnits: 120000, // $1,200.00 / day
      currency: 'USD',
      startDate: '2026-03-01T00:00:00Z',
      targeting: {
        locations: ['United States', 'Canada', 'United Kingdom'],
        ageMin: 24,
        ageMax: 55,
        genders: ['ALL'],
        interests: ['Online Shopping', 'Consumer Electronics', 'Luxury Lifestyle'],
      },
      adGroupCount: 4,
      creativeIds: ['crt_1', 'crt_2'],
      actualSpendMinorUnits: 3840000, // $38,400.00
      impressions: 1420500,
      clicks: 45600,
      conversions: 2180,
      revenueMinorUnits: 14606000, // $146,060.00 -> 3.8x ROAS
      createdAt: '2026-02-28T14:00:00Z',
      updatedAt: '2026-03-15T10:00:00Z',
      version: 1,
    },
    {
      id: 'cmp_google_pmax',
      orgId: 'org_apex',
      provider: 'google',
      providerAccountId: '984-210-9481',
      providerCampaignId: 'goog_pmax_992140',
      name: 'Performance Max Omnichannel Core Revenue Q1-Q2',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      budgetType: 'DAILY',
      budgetMinorUnits: 250000, // $2,500.00 / day
      currency: 'USD',
      startDate: '2026-01-15T00:00:00Z',
      targeting: {
        locations: ['United States', 'Germany', 'France', 'Australia'],
        ageMin: 18,
        ageMax: 65,
        genders: ['ALL'],
        keywords: ['enterprise software solutions', 'omnichannel automation', 'ai commerce tool'],
      },
      adGroupCount: 6,
      creativeIds: ['crt_3'],
      actualSpendMinorUnits: 12500000, // $125,000.00
      impressions: 4890000,
      clicks: 112400,
      conversions: 6240,
      revenueMinorUnits: 51250000, // $512,500.00 -> 4.1x ROAS
      createdAt: '2026-01-14T10:00:00Z',
      updatedAt: '2026-03-10T12:00:00Z',
      version: 2,
    },
    {
      id: 'cmp_tiktok_genz',
      orgId: 'org_apex',
      provider: 'tiktok',
      providerAccountId: 'tt_adv_8391024',
      providerCampaignId: 'tt_cmp_771920',
      name: 'Viral Lifestyle & UGC Creator In-Feed Showcase',
      objective: 'TRAFFIC',
      status: 'ACTIVE',
      budgetType: 'DAILY',
      budgetMinorUnits: 80000, // $800.00 / day
      currency: 'USD',
      startDate: '2026-03-10T00:00:00Z',
      targeting: {
        locations: ['United States', 'United Kingdom'],
        ageMin: 18,
        ageMax: 35,
        genders: ['ALL'],
        interests: ['Tech Trends', 'Gadgets', 'Content Creation'],
      },
      adGroupCount: 3,
      creativeIds: ['crt_4'],
      actualSpendMinorUnits: 1920000, // $19,200.00
      impressions: 2150000,
      clicks: 75250,
      conversions: 890,
      revenueMinorUnits: 4717000, // $47,170.00 -> 2.45x ROAS
      createdAt: '2026-03-09T16:00:00Z',
      updatedAt: '2026-03-16T08:00:00Z',
      version: 1,
    },
    {
      id: 'cmp_linkedin_b2b',
      orgId: 'org_apex',
      provider: 'linkedin',
      providerAccountId: 'li_corp_591029',
      providerCampaignId: 'li_cmp_330194',
      name: 'B2B Enterprise Decision Makers & CTO Spotlight',
      objective: 'LEADS',
      status: 'ACTIVE',
      budgetType: 'DAILY',
      budgetMinorUnits: 150000, // $1,500.00 / day
      currency: 'USD',
      startDate: '2026-02-01T00:00:00Z',
      targeting: {
        locations: ['North America', 'Western Europe'],
        ageMin: 30,
        ageMax: 65,
        genders: ['ALL'],
        interests: ['Cloud Architecture', 'Artificial Intelligence', 'FinTech'],
      },
      adGroupCount: 2,
      creativeIds: ['crt_5'],
      actualSpendMinorUnits: 4500000, // $45,000.00
      impressions: 340000,
      clicks: 8500,
      conversions: 410,
      revenueMinorUnits: 18450000, // $184,500.00 -> 4.1x ROAS
      createdAt: '2026-01-29T11:00:00Z',
      updatedAt: '2026-03-12T09:00:00Z',
      version: 1,
    },
  ];
  campaigns.forEach((c) => store.campaigns.set(c.id, c));

  // 6. Pending Budget Proposal (demonstrating four-eyes approval workflow)
  const proposal1: BudgetProposal = {
    id: 'prp_apex_google_scale',
    orgId: 'org_apex',
    campaignId: 'cmp_google_pmax',
    type: 'BUDGET_INCREASE',
    title: 'Scale Google Performance Max Daily Budget from $2,500 to $3,500',
    description:
      'Q1 ROAS has sustained 4.1x over 30 days. Pacing indicates inventory availability to scale conversions by ~35% with controlled CPA under $22.',
    requestedByUserId: 'usr_priya', // Priya requested
    requestedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'PENDING',
    currentBudgetMinorUnits: 250000, // $2,500.00
    proposedBudgetMinorUnits: 350000, // $3,500.00 (+ $1,000.00 exceeds $500 threshold!)
    currency: 'USD',
    reason: 'Evidence of 4.1x ROAS headroom and strong inventory availability.',
    campaignVersionAtRequest: 2,
  };
  store.proposals.set(proposal1.id, proposal1);

  // 7. Brand Profile
  const brandApex: BrandProfile = {
    id: 'brd_apex',
    orgId: 'org_apex',
    name: 'Apex Global',
    industry: 'Omnichannel Enterprise & Consumer Tech',
    tone: 'Modern, authoritative, highly trustworthy, solution-focused',
    primaryColor: '#2563EB',
    secondaryColor: '#0EA5E9',
    disallowedKeywords: ['cheap', 'guaranteed profits', 'overnight miracle', 'free crypto', 'risk-free'],
    keySellingPoints: [
      'Zero-latency real-time synchronization',
      'Bank-grade data encryption and SOC-2 compliance',
      'Unified cross-channel attribution engine',
      '99.99% uptime enterprise SLA',
    ],
  };
  store.brandProfiles.set(brandApex.id, brandApex);

  // 8. Creative Assets
  const creatives: CreativeAsset[] = [
    {
      id: 'crt_1',
      orgId: 'org_apex',
      name: 'Spring Flash Sale - Dynamic Product Showcase',
      brandProfileId: 'brd_apex',
      headline: 'Automate Ads Across All Channels with Precision',
      description: 'Stop guessing your ROAS. AdVantage AI coordinates Meta, Google, and TikTok ad operations in one verified dashboard.',
      callToAction: 'START_FREE_TRIAL',
      targetUrl: 'https://apexglobal.example.com/platform',
      platformFormats: ['meta', 'tiktok'],
      language: 'en',
      status: 'APPROVED',
      brandSafetyScore: 98,
      brandSafetyNotes: ['Strict tone adhered to', 'No prohibited superlatives', 'Compliant disclaimer attached'],
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
      createdAt: '2026-02-20T10:00:00Z',
    },
    {
      id: 'crt_2',
      orgId: 'org_apex',
      name: 'Hindi Regional Festive Conversion Copy',
      brandProfileId: 'brd_apex',
      headline: 'स्मार्ट एआई विज्ञापनों से अपना आरओएएस 3 गुना बढ़ाएं',
      description: 'मेटा, गूगल और टिकटॉक अभियानों का एक ही सुरक्षित प्लेटफॉर्म पर प्रबंधन करें।',
      callToAction: 'LEARN_MORE',
      targetUrl: 'https://apexglobal.example.com/in',
      platformFormats: ['meta'],
      language: 'hi',
      status: 'APPROVED',
      brandSafetyScore: 96,
      brandSafetyNotes: ['Culturally verified', 'Compliant pricing guidelines'],
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600',
      createdAt: '2026-02-22T12:00:00Z',
    },
  ];
  creatives.forEach((c) => store.creatives.set(c.id, c));

  // 9. Messaging Leads (WhatsApp, Meta Instant Forms)
  const leads: LeadRecord[] = [
    {
      id: 'lead_wa_01',
      orgId: 'org_apex',
      channel: 'WHATSAPP',
      contactName: 'Vikram Mehta',
      contactIdentifier: '+91 98201 54321',
      status: 'NEW',
      campaignId: 'cmp_meta_spring',
      lastMessageSnippet: 'Hi, I saw your Meta campaign. Can we schedule an enterprise demo for 50 users?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      messagingWindowExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
      consentOptIn: true,
      assignedToUserId: 'usr_priya',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'lead_ig_02',
      orgId: 'org_apex',
      channel: 'INSTAGRAM',
      contactName: 'Elena Rostova',
      contactIdentifier: '@elena_digital_scale',
      status: 'QUALIFIED',
      campaignId: 'cmp_meta_spring',
      lastMessageSnippet: 'Thanks for the pricing breakdown. We spend ~$80k/mo across Meta and TikTok.',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      messagingWindowExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
      consentOptIn: true,
      assignedToUserId: 'usr_priya',
      createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    },
  ];
  leads.forEach((l) => store.leads.set(l.id, l));

  // 10. Audit Log Chain
  const genesisEntry = createAuditLogEntry({
    orgId: 'org_apex',
    actorUserId: 'usr_sarah',
    actorEmail: 'sarah.jenkins@advantage-ai.enterprise',
    actorRole: 'OWNER',
    action: 'ORGANIZATION_INITIALIZED',
    entityType: 'ORGANIZATION',
    entityId: 'org_apex',
    details: {
      name: 'Apex Global Commerce',
      defaultCurrency: 'USD',
      dailySpendCeiling: 2500000,
    },
  });
  store.auditLogs.push(genesisEntry);

  const proposalEntry = createAuditLogEntry({
    orgId: 'org_apex',
    actorUserId: 'usr_priya',
    actorEmail: 'priya.sharma@advantage-ai.enterprise',
    actorRole: 'CAMPAIGN_MANAGER',
    action: 'BUDGET_PROPOSAL_SUBMITTED',
    entityType: 'PROPOSAL',
    entityId: proposal1.id,
    prevHash: genesisEntry.hash,
    details: {
      campaignId: 'cmp_google_pmax',
      currentBudget: 250000,
      proposedBudget: 350000,
      currency: 'USD',
    },
  });
  store.auditLogs.push(proposalEntry);

  return store;
}

// Global singleton instance
export const globalStore = initializeStore();
