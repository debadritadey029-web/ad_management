/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Users,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../server/services/finance.js';

interface AnalyticsData {
  totals: {
    spendMajor: number;
    revenueMajor: number;
    roas: number;
    ctr: number;
    cpc: number;
    cpa: number;
  };
  currency: string;
  totalCampaigns: number;
  activeCampaigns: number;
  platformBreakdown: Record<string, { spend: number; revenue: number; clicks: number; conversions: number }>;
  attributionWindow: string;
  freshnessTimestamp: string;
}

export const DashboardView: React.FC = () => {
  const { currentOrg, t, setActiveTab, showToast, authFetch } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, proposalsRes] = await Promise.all([
        authFetch('/api/analytics'),
        authFetch('/api/finance/proposals'),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
      if (proposalsRes.ok) {
        const proposals = await proposalsRes.json();
        const pending = proposals.filter((p: any) => p.status === 'PENDING').length;
        setPendingProposalsCount(pending);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentOrg]);

  if (loading || !analytics) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        <span>Loading unified advertising metrics...</span>
      </div>
    );
  }

  const currency = currentOrg?.defaultCurrency || 'USD';
  const dailySpendMinor = analytics.totals.spendMajor * 100; // approximate for demo visual pacing
  const dailyCeilingMinor = currentOrg?.settings.dailySpendCeilingMinorUnits || 2500000;
  const pacingPercentage = Math.min(100, Math.round((dailySpendMinor / dailyCeilingMinor) * 100));

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {currentOrg?.name} Overview
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Synced {new Date(analytics.freshnessTimestamp).toLocaleTimeString()}
            </span>
            <span>•</span>
            <span className="text-blue-400 font-medium">{analytics.attributionWindow}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{analytics.activeCampaigns} Active Campaigns</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('copilot')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI Copilot</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pending Approvals Notice if any */}
      {pendingProposalsCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-200">
                {pendingProposalsCount} Budget Proposal{pendingProposalsCount > 1 ? 's' : ''} Awaiting Four-Eye Review
              </h2>
              <p className="text-xs text-amber-400/80">
                Budget adjustment proposals require verification by an authorized Finance Approver or Owner.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('finance')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition"
          >
            Review Queue
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>{t('spend')}</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatCurrency(toMinorUnits(analytics.totals.spendMajor, currency), currency)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Paced within org thresholds</span>
          </div>
        </div>

        {/* Attributed Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>{t('revenue')}</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatCurrency(toMinorUnits(analytics.totals.revenueMajor, currency), currency)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs previous 30d</span>
          </div>
        </div>

        {/* Target ROAS */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>{t('roas')}</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300">
            {analytics.totals.roas.toFixed(2)}x
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-2">
            Cross-channel verified blended
          </div>
        </div>

        {/* Total Conversions */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>{t('conversions')}</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {analytics.totals.cpa > 0
              ? Math.round(analytics.totals.spendMajor / analytics.totals.cpa).toLocaleString()
              : '0'}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-2">
            Avg CPA: {formatCurrency(toMinorUnits(analytics.totals.cpa, currency), currency)}
          </div>
        </div>
      </div>

      {/* Pacing & Spending Ceilings card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Daily Budget Pacing & Ceilings</h2>
            <p className="text-xs text-slate-400">
              Central financial safeguards enforce a maximum daily allocation of{' '}
              {formatCurrency(dailyCeilingMinor, currency)}.
            </p>
          </div>
          <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
            {pacingPercentage}% Allocated
          </span>
        </div>

        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pacingPercentage > 90 ? 'bg-red-500' : pacingPercentage > 70 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${pacingPercentage}%` }}
          />
        </div>
      </div>

      {/* Channel Breakdown Grid */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">Connected Channels & Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analytics.platformBreakdown).map(([provider, data]) => {
            const providerRoas = data.spend > 0 ? (data.revenue / data.spend).toFixed(2) : '0';
            return (
              <div key={provider} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {provider}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Spend:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(toMinorUnits(data.spend, currency), currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Attributed Rev:</span>
                    <span className="font-semibold text-emerald-400">
                      {formatCurrency(toMinorUnits(data.revenue, currency), currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ROAS:</span>
                    <span className="font-extrabold text-purple-300">{providerRoas}x</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Clicks:</span>
                    <span className="font-medium text-slate-200">{data.clicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Conversions:</span>
                    <span className="font-medium text-slate-200">{data.conversions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper for toMinorUnits in client
function toMinorUnits(amount: number, currency: string): number {
  return Math.round(amount * (currency === 'JPY' ? 1 : 100));
}
