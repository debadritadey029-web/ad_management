/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProviderType, Campaign, CampaignObjective } from '../../db/types.js';

export interface ProviderCapability {
  provider: ProviderType;
  displayName: string;
  category: 'SOCIAL' | 'SEARCH' | 'VIDEO' | 'PROFESSIONAL' | 'MOBILE';
  apiVersion: string;
  supportsRealTimeMetrics: boolean;
  supportsLeadGeneration: boolean;
  supportsAutomatedBidding: boolean;
  supportsVideoCreatives: boolean;
  minDailyBudgetMinorUnits: Record<string, number>; // by currency, e.g. USD: 100 ($1.00)
  maxHeadlineLength: number;
  maxDescriptionLength: number;
}

export const PROVIDER_CATALOG: Record<ProviderType, ProviderCapability> = {
  meta: {
    provider: 'meta',
    displayName: 'Meta Ads (Facebook & Instagram)',
    category: 'SOCIAL',
    apiVersion: 'v21.0 Graph API',
    supportsRealTimeMetrics: true,
    supportsLeadGeneration: true,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: true,
    minDailyBudgetMinorUnits: { USD: 100, EUR: 100, GBP: 100, INR: 8000, JPY: 150 },
    maxHeadlineLength: 40,
    maxDescriptionLength: 125,
  },
  google: {
    provider: 'google',
    displayName: 'Google Ads & YouTube',
    category: 'SEARCH',
    apiVersion: 'Google Ads API v18',
    supportsRealTimeMetrics: true,
    supportsLeadGeneration: true,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: true,
    minDailyBudgetMinorUnits: { USD: 500, EUR: 500, GBP: 500, INR: 40000, JPY: 700 },
    maxHeadlineLength: 30,
    maxDescriptionLength: 90,
  },
  tiktok: {
    provider: 'tiktok',
    displayName: 'TikTok Ads',
    category: 'VIDEO',
    apiVersion: 'TikTok Marketing API v1.3',
    supportsRealTimeMetrics: true,
    supportsLeadGeneration: true,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: true,
    minDailyBudgetMinorUnits: { USD: 2000, EUR: 2000, GBP: 2000, INR: 160000, JPY: 3000 },
    maxHeadlineLength: 100,
    maxDescriptionLength: 100,
  },
  linkedin: {
    provider: 'linkedin',
    displayName: 'LinkedIn Ads',
    category: 'PROFESSIONAL',
    apiVersion: 'LinkedIn Marketing Solutions v2',
    supportsRealTimeMetrics: false,
    supportsLeadGeneration: true,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: true,
    minDailyBudgetMinorUnits: { USD: 1000, EUR: 1000, GBP: 1000, INR: 80000, JPY: 1500 },
    maxHeadlineLength: 70,
    maxDescriptionLength: 150,
  },
  microsoft: {
    provider: 'microsoft',
    displayName: 'Microsoft Advertising',
    category: 'SEARCH',
    apiVersion: 'Bing Ads API v13',
    supportsRealTimeMetrics: false,
    supportsLeadGeneration: false,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: false,
    minDailyBudgetMinorUnits: { USD: 500, EUR: 500, GBP: 500, INR: 40000, JPY: 700 },
    maxHeadlineLength: 30,
    maxDescriptionLength: 90,
  },
  pinterest: {
    provider: 'pinterest',
    displayName: 'Pinterest Ads',
    category: 'SOCIAL',
    apiVersion: 'Pinterest API v5',
    supportsRealTimeMetrics: false,
    supportsLeadGeneration: false,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: true,
    minDailyBudgetMinorUnits: { USD: 500, EUR: 500, GBP: 500, INR: 40000, JPY: 700 },
    maxHeadlineLength: 100,
    maxDescriptionLength: 500,
  },
  snapchat: {
    provider: 'snapchat',
    displayName: 'Snapchat Ads',
    category: 'SOCIAL',
    apiVersion: 'Snap Marketing API v1',
    supportsRealTimeMetrics: false,
    supportsLeadGeneration: true,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: true,
    minDailyBudgetMinorUnits: { USD: 500, EUR: 500, GBP: 500, INR: 40000, JPY: 700 },
    maxHeadlineLength: 34,
    maxDescriptionLength: 0,
  },
  reddit: {
    provider: 'reddit',
    displayName: 'Reddit Ads',
    category: 'SOCIAL',
    apiVersion: 'Reddit Ads API v2',
    supportsRealTimeMetrics: false,
    supportsLeadGeneration: false,
    supportsAutomatedBidding: false,
    supportsVideoCreatives: true,
    minDailyBudgetMinorUnits: { USD: 500, EUR: 500, GBP: 500, INR: 40000, JPY: 700 },
    maxHeadlineLength: 300,
    maxDescriptionLength: 0,
  },
  x: {
    provider: 'x',
    displayName: 'X Ads',
    category: 'SOCIAL',
    apiVersion: 'X Ads API v12',
    supportsRealTimeMetrics: false,
    supportsLeadGeneration: false,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: true,
    minDailyBudgetMinorUnits: { USD: 500, EUR: 500, GBP: 500, INR: 40000, JPY: 700 },
    maxHeadlineLength: 280,
    maxDescriptionLength: 0,
  },
  apple: {
    provider: 'apple',
    displayName: 'Apple Search Ads',
    category: 'MOBILE',
    apiVersion: 'Apple Search Ads API v5',
    supportsRealTimeMetrics: false,
    supportsLeadGeneration: false,
    supportsAutomatedBidding: true,
    supportsVideoCreatives: false,
    minDailyBudgetMinorUnits: { USD: 1000, EUR: 1000, GBP: 1000, INR: 80000, JPY: 1500 },
    maxHeadlineLength: 50,
    maxDescriptionLength: 150,
  },
};

export function validateCreativeForProvider(
  provider: ProviderType,
  headline: string,
  description: string
): { valid: boolean; errors: string[] } {
  const cap = PROVIDER_CATALOG[provider];
  const errors: string[] = [];

  if (!cap) {
    return { valid: false, errors: [`Unknown provider: ${provider}`] };
  }

  if (headline.length > cap.maxHeadlineLength) {
    errors.push(
      `Headline exceeds ${cap.displayName} limit of ${cap.maxHeadlineLength} characters (current: ${headline.length}).`
    );
  }

  if (cap.maxDescriptionLength > 0 && description.length > cap.maxDescriptionLength) {
    errors.push(
      `Description exceeds ${cap.displayName} limit of ${cap.maxDescriptionLength} characters (current: ${description.length}).`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCampaignMinBudget(
  provider: ProviderType,
  budgetMinorUnits: number,
  currency: string
): { valid: boolean; minRequiredMinorUnits: number; error?: string } {
  const cap = PROVIDER_CATALOG[provider];
  const minRequired = cap?.minDailyBudgetMinorUnits[currency.toUpperCase()] ?? 100;

  if (budgetMinorUnits < minRequired) {
    return {
      valid: false,
      minRequiredMinorUnits: minRequired,
      error: `Minimum daily budget for ${cap.displayName} in ${currency} is ${minRequired} minor units.`,
    };
  }

  return {
    valid: true,
    minRequiredMinorUnits: minRequired,
  };
}
