/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toMinorUnits,
  fromMinorUnits,
  formatCurrency,
  evaluateBudgetPolicy,
  calculateMarketingMetrics,
} from '../services/finance.js';

test('Financial minor units calculation across multiple currencies', () => {
  // USD (2 decimals)
  assert.equal(toMinorUnits(150.25, 'USD'), 15025);
  assert.equal(fromMinorUnits(15025, 'USD'), 150.25);

  // JPY (0 decimals)
  assert.equal(toMinorUnits(5000, 'JPY'), 5000);
  assert.equal(fromMinorUnits(5000, 'JPY'), 5000);

  // KWD (3 decimals)
  assert.equal(toMinorUnits(12.345, 'KWD'), 12345);
  assert.equal(fromMinorUnits(12345, 'KWD'), 12.345);

  // INR (2 decimals)
  assert.equal(toMinorUnits(999.99, 'INR'), 99999);
});

test('Formatting currency respects currency standards', () => {
  const formattedUsd = formatCurrency(250000, 'USD', 'en-US');
  assert.ok(formattedUsd.includes('2,500'));

  const formattedJpy = formatCurrency(5000, 'JPY', 'ja-JP');
  assert.ok(formattedJpy.includes('5,000'));
});

test('Financial Policy: Emergency Stop halts any budget changes', () => {
  const result = evaluateBudgetPolicy({
    currentBudgetMinorUnits: 100000,
    proposedBudgetMinorUnits: 150000,
    currency: 'USD',
    thresholdMinorUnits: 50000,
    dailyCeilingMinorUnits: 5000000,
    requesterUserId: 'usr_priya',
    emergencyStopActive: true, // Emergency Stop ON
    campaignVersion: 1,
    proposalCampaignVersion: 1,
  });

  assert.equal(result.allowed, false);
  assert.ok(result.reasons[0].includes('EMERGENCY_STOP_ACTIVE'));
});

test('Financial Policy: Four-Eyes Principle prevents self-approval', () => {
  const result = evaluateBudgetPolicy({
    currentBudgetMinorUnits: 100000,
    proposedBudgetMinorUnits: 120000,
    currency: 'USD',
    thresholdMinorUnits: 50000,
    dailyCeilingMinorUnits: 5000000,
    requesterUserId: 'usr_priya',
    approverUserId: 'usr_priya', // Requester attempts to approve their own proposal!
    emergencyStopActive: false,
    campaignVersion: 1,
    proposalCampaignVersion: 1,
  });

  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some((r) => r.includes('SELF_APPROVAL_PROHIBITED')));
});

test('Financial Policy: Stale proposal rejected when campaign version changed', () => {
  const result = evaluateBudgetPolicy({
    currentBudgetMinorUnits: 100000,
    proposedBudgetMinorUnits: 120000,
    currency: 'USD',
    thresholdMinorUnits: 50000,
    dailyCeilingMinorUnits: 5000000,
    requesterUserId: 'usr_priya',
    approverUserId: 'usr_marcus',
    emergencyStopActive: false,
    campaignVersion: 3, // Campaign has been edited
    proposalCampaignVersion: 1, // Stale proposal based on version 1
  });

  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some((r) => r.includes('STALE_PROPOSAL')));
});

test('Marketing Metrics: accurately calculates ROAS, CTR, CPC, CPA', () => {
  const metrics = calculateMarketingMetrics({
    spendMinorUnits: 100000, // $1,000.00
    impressions: 50000,
    clicks: 2500,
    conversions: 100,
    revenueMinorUnits: 400000, // $4,000.00
    currency: 'USD',
  });

  assert.equal(metrics.spendMajor, 1000);
  assert.equal(metrics.revenueMajor, 4000);
  assert.equal(metrics.ctr, 5.0); // (2500 / 50000) * 100
  assert.equal(metrics.cpc, 0.4); // 1000 / 2500
  assert.equal(metrics.cpa, 10.0); // 1000 / 100
  assert.equal(metrics.roas, 4.0); // 4000 / 1000
});
