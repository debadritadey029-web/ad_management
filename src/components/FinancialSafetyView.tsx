/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { formatCurrency, fromMinorUnits } from '../server/services/finance.js';
import { BudgetProposal } from '../server/db/types.js';

export const FinancialSafetyView: React.FC = () => {
  const {
    currentOrg,
    user,
    membership,
    permissions,
    showToast,
    refreshContext,
    triggerEmergencyStop,
    releaseEmergencyStop,
    authFetch,
  } = useApp();

  const [proposals, setProposals] = useState<BudgetProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Settings form
  const [thresholdInput, setThresholdInput] = useState(
    String(fromMinorUnits(currentOrg?.settings.budgetChangeApprovalThresholdMinorUnits || 50000, currentOrg?.defaultCurrency || 'USD'))
  );
  const [dailyCeilingInput, setDailyCeilingInput] = useState(
    String(fromMinorUnits(currentOrg?.settings.dailySpendCeilingMinorUnits || 2500000, currentOrg?.defaultCurrency || 'USD'))
  );

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/finance/proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading approval queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [currentOrg]);

  const handleReview = async (proposalId: string, action: 'APPROVE' | 'REJECT') => {
    if (!permissions.includes('APPROVE_BUDGETS')) {
      showToast('Permission denied: You do not have APPROVE_BUDGETS authority.', 'error');
      return;
    }

    try {
      const res = await authFetch(`/api/finance/proposals/${proposalId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: reviewNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to review proposal', 'error');
        return;
      }

      showToast(
        action === 'APPROVE'
          ? 'Budget Proposal APPROVED and successfully executed on live campaign!'
          : 'Budget Proposal REJECTED.',
        action === 'APPROVE' ? 'success' : 'info'
      );
      setReviewNotes('');
      fetchProposals();
      refreshContext();
    } catch {
      showToast('Network error processing review', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.includes('MANAGE_ORGS')) {
      showToast('Permission denied: Requires MANAGE_ORGS permission.', 'error');
      return;
    }

    const curr = currentOrg?.defaultCurrency || 'USD';
    const mult = curr === 'JPY' ? 1 : 100;

    try {
      const res = await authFetch('/api/organizations/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetApprovalThresholdMinorUnits: Math.round(Number(thresholdInput) * mult),
          dailySpendCeilingMinorUnits: Math.round(Number(dailyCeilingInput) * mult),
        }),
      });

      if (res.ok) {
        showToast('Financial safety policy updated successfully', 'success');
        setShowSettingsModal(false);
        refreshContext();
      }
    } catch {
      showToast('Failed to update financial settings', 'error');
    }
  };

  const isEmergency = currentOrg?.emergencyStopActive;
  const currency = currentOrg?.defaultCurrency || 'USD';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Central Financial Safety Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Exact minor-unit arithmetic, Four-Eyes separation of duties, and instant killswitch containment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            <Sliders className="w-4 h-4" />
            <span>Policy Settings</span>
          </button>
        </div>
      </div>

      {/* Emergency Stop Card */}
      <div
        className={`border p-6 rounded-2xl transition-all shadow-sm ${
          isEmergency
            ? 'bg-red-950/40 border-red-500/50 text-red-200'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3.5 rounded-xl shrink-0 ${
                isEmergency ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {isEmergency ? <ShieldAlert className="w-8 h-8 animate-pulse" /> : <ShieldCheck className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {isEmergency ? 'EMERGENCY STOP IS ACTIVE' : 'Central Emergency Stop Protection'}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isEmergency ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isEmergency ? 'KILLSWITCH ENGAGED' : 'NORMAL ENFORCEMENT'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isEmergency
                  ? `All outbound provider writes, campaign creations, and budget executions are halted. Reason: "${currentOrg?.emergencyStopReason}".`
                  : 'Centrally enforced across Meta Ads, Google Ads, TikTok Ads, and LinkedIn Ads. Triggering halts all queued jobs and API write updates instantly.'}
              </p>
            </div>
          </div>

          <div>
            {isEmergency ? (
              <button
                onClick={releaseEmergencyStop}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Release Emergency Stop
              </button>
            ) : (
              <button
                onClick={() => {
                  const reason = prompt('Enter reason for triggering Emergency Killswitch:');
                  if (reason) triggerEmergencyStop(reason);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Engage Killswitch
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Four-Eyes Approval Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Four-Eye Approval Queue
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Requires independent reviewer (Requester ≠ Reviewer) to prevent unilateral budget adjustments.
            </p>
          </div>
          <button
            onClick={fetchProposals}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>Loading proposals...</span>
          </div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No budget proposals currently in the queue.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {proposals.map((prp) => {
              const isRequester = prp.requestedByUserId === user?.id;
              const isPending = prp.status === 'PENDING';
              const delta = prp.proposedBudgetMinorUnits - prp.currentBudgetMinorUnits;
              const isIncrease = delta > 0;

              return (
                <div key={prp.id} className="p-5 space-y-3 hover:bg-slate-800/30 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{prp.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prp.status === 'EXECUTED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : prp.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400'
                              : prp.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {prp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {prp.description} • Justification: &quot;{prp.reason}&quot;
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-slate-400">
                          {formatCurrency(prp.currentBudgetMinorUnits, prp.currency)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-white font-bold">
                          {formatCurrency(prp.proposedBudgetMinorUnits, prp.currency)}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] font-bold ${
                          isIncrease ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isIncrease ? '+' : ''}
                        {formatCurrency(delta, prp.currency)} / day
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800/60 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Requested by <strong className="text-slate-200">{prp.requestedByUserId}</strong> on{' '}
                        {new Date(prp.requestedAt).toLocaleString()}
                      </span>
                      {prp.reviewedByUserId && (
                        <span>
                          • Reviewed by <strong className="text-slate-200">{prp.reviewedByUserId}</strong>
                        </span>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        {isRequester && currentOrg?.settings.requireFourEyesApproval && (
                          <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-1 rounded">
                            Self-approval prohibited (Four-Eye Policy)
                          </span>
                        )}

                        <button
                          onClick={() => handleReview(prp.id, 'REJECT')}
                          disabled={!permissions.includes('APPROVE_BUDGETS') || isEmergency}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold rounded-lg transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReview(prp.id, 'APPROVE')}
                          disabled={
                            !permissions.includes('APPROVE_BUDGETS') ||
                            isEmergency ||
                            (isRequester && currentOrg?.settings.requireFourEyesApproval)
                          }
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-md disabled:opacity-40"
                        >
                          Approve & Execute
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Policy Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">Financial Policy Governance</h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure spending ceilings and threshold triggers for {currentOrg?.name}.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Four-Eye Approval Threshold ({currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Budget adjustments exceeding this amount mandate independent review.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  Organization Daily Spending Ceiling ({currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={dailyCeilingInput}
                  onChange={(e) => setDailyCeilingInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
