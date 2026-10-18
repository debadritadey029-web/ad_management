/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Plus,
  Filter,
  Play,
  Pause,
  ArrowUpRight,
  ShieldAlert,
  X,
  RefreshCw,
  Search,
} from 'lucide-react';
import { formatCurrency, fromMinorUnits, toMinorUnits } from '../server/services/finance.js';
import { Campaign, ProviderType } from '../server/db/types.js';

export const CampaignsView: React.FC = () => {
  const { currentOrg, membership, permissions, showToast, t, authFetch } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [targetCampaignForProposal, setTargetCampaignForProposal] = useState<Campaign | null>(null);

  // New Campaign Form
  const [newCampName, setNewCampName] = useState('');
  const [newCampProvider, setNewCampProvider] = useState<ProviderType>('meta');
  const [newCampBudget, setNewCampBudget] = useState('100');
  const [newCampObjective, setNewCampObjective] = useState('CONVERSIONS');

  // Proposal Form
  const [proposedBudget, setProposedBudget] = useState('');
  const [proposalReason, setProposalReason] = useState('');

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [currentOrg]);

  const handleToggleStatus = async (camp: Campaign) => {
    if (!permissions.includes('EDIT_CAMPAIGNS')) {
      showToast('Permission denied: You do not have EDIT_CAMPAIGNS permission.', 'error');
      return;
    }

    if (currentOrg?.emergencyStopActive) {
      showToast('Emergency Stop is Active! All write operations are locked.', 'error');
      return;
    }

    const nextStatus = camp.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await authFetch(`/api/campaigns/${camp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update status', 'error');
        return;
      }
      showToast(`Campaign ${camp.name} is now ${nextStatus}`, 'success');
      fetchCampaigns();
    } catch {
      showToast('Network error updating campaign status', 'error');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;

    try {
      const res = await authFetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampName,
          provider: newCampProvider,
          objective: newCampObjective,
          budgetAmount: Number(newCampBudget),
          currency: currentOrg?.defaultCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to create campaign', 'error');
        return;
      }

      showToast(`Campaign "${newCampName}" created successfully!`, 'success');
      setShowCreateModal(false);
      setNewCampName('');
      fetchCampaigns();
    } catch {
      showToast('Network error creating campaign', 'error');
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCampaignForProposal || !proposedBudget) return;

    try {
      const res = await authFetch('/api/finance/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: targetCampaignForProposal.id,
          proposedBudgetAmount: Number(proposedBudget),
          title: `Budget Adjustment: ${targetCampaignForProposal.name}`,
          description: `Adjustment proposed by ${membership?.role || 'User'}`,
          reason: proposalReason || 'Scaling high-intent audience inventory.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit proposal', 'error');
        return;
      }

      showToast('Budget proposal submitted to Four-Eye Approval Queue!', 'success');
      setShowProposalModal(false);
      setTargetCampaignForProposal(null);
      setProposedBudget('');
      setProposalReason('');
    } catch {
      showToast('Network error submitting proposal', 'error');
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesProvider = selectedProvider === 'ALL' || c.provider === selectedProvider;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Cross-Channel Campaign Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official API adapters for Meta, Google, TikTok, LinkedIn, Microsoft, Pinterest, and Reddit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={currentOrg?.emergencyStopActive}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newCampaign')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex flex-wrap gap-1.5 text-xs">
            {['ALL', 'meta', 'google', 'tiktok', 'linkedin'].map((prov) => (
              <button
                key={prov}
                onClick={() => setSelectedProvider(prov)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition ${
                  selectedProvider === prov
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>Loading active campaigns...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No campaigns found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Campaign</th>
                  <th className="py-3.5 px-4 font-bold">Channel</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Daily Budget</th>
                  <th className="py-3.5 px-4 font-bold">Actual Spend</th>
                  <th className="py-3.5 px-4 font-bold">ROAS</th>
                  <th className="py-3.5 px-4 font-bold">Conversions</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCampaigns.map((camp) => {
                  const spend = fromMinorUnits(camp.actualSpendMinorUnits, camp.currency);
                  const rev = fromMinorUnits(camp.revenueMinorUnits, camp.currency);
                  const roas = spend > 0 ? (rev / spend).toFixed(2) : '0';

                  return (
                    <tr key={camp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        <div className="font-semibold">{camp.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {camp.providerAccountId} • Ver: {camp.version}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[11px] uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                          {camp.provider}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            camp.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : camp.status === 'PAUSED'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {formatCurrency(camp.budgetMinorUnits, camp.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {formatCurrency(camp.actualSpendMinorUnits, camp.currency)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-300">
                        {roas}x
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {camp.conversions.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setTargetCampaignForProposal(camp);
                              setProposedBudget(String(fromMinorUnits(camp.budgetMinorUnits, camp.currency)));
                              setShowProposalModal(true);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold rounded text-[11px] transition"
                            title="Propose budget adjustment under four-eyes policy"
                          >
                            Propose Budget
                          </button>
                          <button
                            onClick={() => handleToggleStatus(camp)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title={camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Activate Campaign'}
                          >
                            {camp.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Create Verified Advertising Campaign</h3>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Omnichannel Growth Wave"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Ad Provider</label>
                  <select
                    value={newCampProvider}
                    onChange={(e) => setNewCampProvider(e.target.value as ProviderType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="meta">Meta Ads (Facebook & IG)</option>
                    <option value="google">Google Ads & YouTube</option>
                    <option value="tiktok">TikTok Ads</option>
                    <option value="linkedin">LinkedIn Ads</option>
                    <option value="microsoft">Microsoft Advertising</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Objective</label>
                  <select
                    value={newCampObjective}
                    onChange={(e) => setNewCampObjective(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CONVERSIONS">Conversions / Sales</option>
                    <option value="TRAFFIC">Traffic</option>
                    <option value="LEADS">Lead Generation</option>
                    <option value="AWARENESS">Brand Awareness</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Daily Budget ({currentOrg?.defaultCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  value={newCampBudget}
                  onChange={(e) => setNewCampBudget(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Budget is converted to exact minor units and validated against organization daily ceilings.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Propose Budget Modal */}
      {showProposalModal && targetCampaignForProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowProposalModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2">Propose Budget Adjustment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Campaign: <span className="text-white font-semibold">{targetCampaignForProposal.name}</span>
            </p>

            <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Current Budget: {formatCurrency(targetCampaignForProposal.budgetMinorUnits, targetCampaignForProposal.currency)}
                </label>
                <div className="text-[11px] text-slate-400 mb-2">
                  Changes exceeding threshold require Four-Eye approval before provider write execution.
                </div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Proposed Daily Budget ({targetCampaignForProposal.currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  value={proposedBudget}
                  onChange={(e) => setProposedBudget(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Justification & Pacing Rationale:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide evidence of ROAS capacity, auction density, or seasonality..."
                  value={proposalReason}
                  onChange={(e) => setProposalReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
