/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../server/services/finance.js';

export const AnalyticsView: React.FC = () => {
  const { currentOrg, t, showToast, authFetch } = useApp();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      showToast('Error loading analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentOrg]);

  const handleExportCsv = () => {
    if (!analytics) return;
    const headers = ['Platform', 'Spend', 'Attributed Revenue', 'Clicks', 'Conversions', 'ROAS'];
    const rows = Object.entries(analytics.platformBreakdown).map(([platform, data]: [string, any]) => {
      const roas = data.spend > 0 ? (data.revenue / data.spend).toFixed(2) : '0';
      return [platform.toUpperCase(), data.spend, data.revenue, data.clicks, data.conversions, roas];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `advantage_ai_analytics_${currentOrg?.slug}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics CSV exported successfully', 'success');
  };

  if (loading || !analytics) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        <span>Aggregating normalized cross-channel metrics...</span>
      </div>
    );
  }

  const currency = currentOrg?.defaultCurrency || 'USD';
  const totals = analytics.totals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Normalized Performance Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Uniform cross-network attribution, frequency metrics, and currency-aware financial pacing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              <option value="7d" className="bg-slate-900">Last 7 Days</option>
              <option value="30d" className="bg-slate-900">Last 30 Days</option>
              <option value="qtd" className="bg-slate-900">Quarter to Date</option>
              <option value="ytd" className="bg-slate-900">Year to Date</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* Attribution Disclosure */}
      <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span>
            Attribution Standard: <strong className="text-slate-200">{analytics.attributionWindow}</strong>
          </span>
        </div>
        <span>Data Freshness: 99.8%</span>
      </div>

      {/* High-Level Normalized Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">CTR</div>
          <div className="text-xl font-bold text-white">{totals.ctr}%</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" /> +0.4%
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">Avg CPC</div>
          <div className="text-xl font-bold text-white">${totals.cpc.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Cross-platform</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">CPM</div>
          <div className="text-xl font-bold text-white">${totals.cpm.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Per 1,000 views</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">Blended CPA</div>
          <div className="text-xl font-bold text-white">${totals.cpa.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1 font-semibold">
            Target &lt;$25.00
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">Blended ROAS</div>
          <div className="text-xl font-bold text-purple-300">{totals.roas.toFixed(2)}x</div>
          <div className="text-[10px] text-purple-400 mt-1 font-semibold">Enterprise benchmark</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">Conv Rate</div>
          <div className="text-xl font-bold text-sky-300">{totals.conversionRate}%</div>
          <div className="text-[10px] text-slate-400 mt-1">Clicks to Actions</div>
        </div>
      </div>

      {/* Cross-Channel Performance Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Platform Performance Matrix</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Channel</th>
                <th className="py-3.5 px-4 font-bold">Spend</th>
                <th className="py-3.5 px-4 font-bold">Attributed Revenue</th>
                <th className="py-3.5 px-4 font-bold">Clicks</th>
                <th className="py-3.5 px-4 font-bold">Conversions</th>
                <th className="py-3.5 px-4 font-bold">ROAS</th>
                <th className="py-3.5 px-4 font-bold">Efficiency Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {Object.entries(analytics.platformBreakdown).map(([prov, data]: [string, any]) => {
                const roas = data.spend > 0 ? data.revenue / data.spend : 0;
                return (
                  <tr key={prov} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold uppercase text-white">{prov}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      ${data.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      ${data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{data.clicks.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-300">{data.conversions.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-bold text-purple-300">{roas.toFixed(2)}x</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          roas >= 3.5
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : roas >= 2.0
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {roas >= 3.5 ? 'TOP PERFORMER' : roas >= 2.0 ? 'HEALTHY PACING' : 'NEEDS OPTIMIZATION'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
