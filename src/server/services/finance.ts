/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Supported currency precision configuration
export const CURRENCY_PRECISION: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  JPY: 0,
  KWD: 3,
  BHD: 3,
  AUD: 2,
  CAD: 2,
  SGD: 2,
  AED: 2,
};

export function getCurrencyMultiplier(currency: string): number {
  const precision = CURRENCY_PRECISION[currency.toUpperCase()] ?? 2;
  return Math.pow(10, precision);
}

/**
 * Converts major unit float (e.g. 150.25 USD) to exact integer minor units (15025 cents).
 * Prevents floating point inaccuracy like 0.1 + 0.2 = 0.30000000000000004.
 */
export function toMinorUnits(amount: number, currency: string): number {
  if (isNaN(amount) || !isFinite(amount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  const mult = getCurrencyMultiplier(currency);
  return Math.round(amount * mult);
}

/**
 * Converts exact integer minor units (e.g. 15025 cents) to display major unit number (150.25).
 */
export function fromMinorUnits(minorUnits: number, currency: string): number {
  if (!Number.isInteger(minorUnits)) {
    throw new Error(`Minor units must be an integer: ${minorUnits}`);
  }
  const mult = getCurrencyMultiplier(currency);
  return minorUnits / mult;
}

/**
 * Formats minor units for localized display.
 */
export function formatCurrency(
  minorUnits: number,
  currency: string,
  locale: string = 'en-US'
): string {
  const major = fromMinorUnits(minorUnits, currency);
  const precision = CURRENCY_PRECISION[currency.toUpperCase()] ?? 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(precision)}`;
  }
}

export interface BudgetApprovalCheckParams {
  currentBudgetMinorUnits: number;
  proposedBudgetMinorUnits: number;
  currency: string;
  thresholdMinorUnits: number;
  dailyCeilingMinorUnits: number;
  requesterUserId: string;
  approverUserId?: string;
  emergencyStopActive: boolean;
  campaignVersion: number;
  proposalCampaignVersion: number;
}

export interface BudgetApprovalCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  reasons: string[];
}

/**
 * Deterministic application-level financial policy evaluation.
 * Enforces:
 * 1. Emergency-stop absolute block on budget increases and live write executions
 * 2. Four-eye principle: Requester cannot self-approve
 * 3. Proposal staleness detection: campaign version must match proposal version
 * 4. Threshold checks: increases beyond threshold require approval
 * 5. Spending ceiling checks: proposed budget cannot exceed organization maximum ceiling
 */
export function evaluateBudgetPolicy(
  params: BudgetApprovalCheckParams
): BudgetApprovalCheckResult {
  const reasons: string[] = [];

  // 1. Emergency stop check
  if (params.emergencyStopActive) {
    return {
      allowed: false,
      requiresApproval: true,
      reasons: ['EMERGENCY_STOP_ACTIVE: Financial writes are halted organization-wide.'],
    };
  }

  // 2. Budget sanity
  if (params.proposedBudgetMinorUnits <= 0) {
    return {
      allowed: false,
      requiresApproval: false,
      reasons: ['PROPOSED_BUDGET_MUST_BE_POSITIVE'],
    };
  }

  // 3. Organization ceiling check
  if (params.proposedBudgetMinorUnits > params.dailyCeilingMinorUnits) {
    reasons.push(
      `EXCEEDS_CEILING: Proposed budget (${params.proposedBudgetMinorUnits}) exceeds org daily ceiling (${params.dailyCeilingMinorUnits}).`
    );
  }

  // 4. Stale proposal check (optimistic locking)
  if (params.campaignVersion !== params.proposalCampaignVersion) {
    reasons.push(
      `STALE_PROPOSAL: Campaign was modified (version ${params.campaignVersion}) since proposal creation (version ${params.proposalCampaignVersion}).`
    );
  }

  // 5. Four-eyes separation of duties
  if (params.approverUserId && params.approverUserId === params.requesterUserId) {
    reasons.push('SELF_APPROVAL_PROHIBITED: Requester cannot approve their own financial proposal.');
  }

  // 6. Threshold requirement
  const delta = params.proposedBudgetMinorUnits - params.currentBudgetMinorUnits;
  const requiresApproval =
    delta > params.thresholdMinorUnits ||
    delta / Math.max(1, params.currentBudgetMinorUnits) > 0.2 ||
    params.proposedBudgetMinorUnits > params.thresholdMinorUnits;

  const allowed = reasons.length === 0;

  return {
    allowed,
    requiresApproval,
    reasons,
  };
}

/**
 * Calculates key marketing metrics deterministically.
 */
export function calculateMarketingMetrics(metrics: {
  spendMinorUnits: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenueMinorUnits: number;
  currency: string;
}) {
  const { spendMinorUnits, impressions, clicks, conversions, revenueMinorUnits, currency } = metrics;
  const spendMajor = fromMinorUnits(spendMinorUnits, currency);
  const revenueMajor = fromMinorUnits(revenueMinorUnits, currency);

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spendMajor / clicks : 0;
  const cpm = impressions > 0 ? (spendMajor / impressions) * 1000 : 0;
  const cpa = conversions > 0 ? spendMajor / conversions : 0;
  const roas = spendMajor > 0 ? revenueMajor / spendMajor : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

  return {
    spendMajor,
    revenueMajor,
    ctr: Number(ctr.toFixed(2)),
    cpc: Number(cpc.toFixed(2)),
    cpm: Number(cpm.toFixed(2)),
    cpa: Number(cpa.toFixed(2)),
    roas: Number(roas.toFixed(2)),
    conversionRate: Number(conversionRate.toFixed(2)),
  };
}
