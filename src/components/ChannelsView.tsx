/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Network,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ProviderConnection, ProviderType } from '../server/db/types.js';
import { ProviderCapability } from '../server/services/providers/index.js';

export const ChannelsView: React.FC = () => {
  const { currentOrg, showToast, authFetch } = useApp();
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [catalog, setCatalog] = useState<Record<ProviderType, ProviderCapability> | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        setCatalog(data.catalog || null);
      }
    } catch {
      showToast('Error loading provider channels', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [currentOrg]);

  const handleSync = async (conn: ProviderConnection) => {
    try {
      setSyncingId(conn.id);
      const res = await authFetch(`/api/providers/${conn.id}/sync`, { method: 'POST' });
      if (res.ok) {
        showToast(`Synced ${conn.accountName} successfully!`, 'success');
        fetchProviders();
      }
    } catch {
      showToast('Network error during sync', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  if (loading || !catalog) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        <span>Loading official API connectors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-sky-600 to-blue-600 rounded-xl text-white shadow-lg shadow-sky-500/20">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Official Advertising API Connectors
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic adapters with secure token renewal, quota monitoring, and granular capabilities.
            </p>
          </div>
        </div>

        <button
          onClick={fetchProviders}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Grid of All Supported Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(Object.keys(catalog) as ProviderType[]).map((provKey) => {
          const cap = catalog[provKey];
          const conn = connections.find((c) => c.provider === provKey);
          const isConnected = Boolean(conn);

          return (
            <div
              key={provKey}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition ${
                isConnected ? 'border-slate-800 shadow-sm' : 'border-slate-800/50 opacity-70'
              }`}
            >
              {/* Header & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {cap.displayName}
                  </h2>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    API Spec: {cap.apiVersion}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    conn?.status === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : conn?.status === 'SANDBOX'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {conn?.status || 'UNCONFIGURED'}
                </span>
              </div>

              {/* Connected Details */}
              {conn ? (
                <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                  <div className="text-slate-300 font-semibold">{conn.accountName}</div>
                  <div className="text-[11px] text-slate-400">Account ID: {conn.accountId}</div>

                  {/* Quota Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>API Quota Used</span>
                      <span>{conn.apiQuotaUsedPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${conn.apiQuotaUsedPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    Last Synced: {new Date(conn.lastSyncAt).toLocaleTimeString()}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleSync(conn)}
                      disabled={syncingId === conn.id}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                      <span>Sync Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 space-y-2">
                  <p className="text-[11px]">
                    Adapter implemented. Official OAuth approval or credentials required for live synchronization.
                  </p>
                  <button
                    onClick={() => showToast(`OAuth flow for ${cap.displayName} initiated (Sandbox/Demo Mode)`, 'info')}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-lg transition"
                  >
                    Connect Account
                  </button>
                </div>
              )}

              {/* Capabilities checklist */}
              <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                <span className={cap.supportsRealTimeMetrics ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Real-time Metrics
                </span>
                <span className={cap.supportsLeadGeneration ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Lead Generation
                </span>
                <span className={cap.supportsAutomatedBidding ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Automated Bidding
                </span>
                <span className={cap.supportsVideoCreatives ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Video Formats
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
