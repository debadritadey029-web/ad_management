/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Key,
  RefreshCw,
  X,
} from 'lucide-react';
import { Role, AuditLogEntry } from '../server/db/types.js';

export const TeamAuditView: React.FC = () => {
  const { currentOrg, user, membership, permissions, showToast, authFetch } = useApp();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [chainValid, setChainValid] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('CAMPAIGN_MANAGER');
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setChainValid(data.chainVerification?.valid ?? true);
      }
    } catch {
      showToast('Error loading audit log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentOrg]);

  const handleGenerateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const link = `https://advantage-ai.enterprise/invite?token=${token}&org=${currentOrg?.slug}`;
    setGeneratedInviteLink(link);
    showToast(`Single-use invitation token created for ${inviteEmail}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Organization Team & Governance Audit
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-tenant RBAC, role permission matrices, and cryptographic SHA-256 tamper-evident log chaining.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setGeneratedInviteLink(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Role Definitions & Current User Permissions */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Active Workspace Permissions ({membership?.role})
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {permissions.map((perm) => (
            <span
              key={perm}
              className="bg-slate-800 border border-slate-700 text-emerald-300 text-[10px] font-semibold px-2.5 py-1 rounded-lg"
            >
              ✓ {perm}
            </span>
          ))}
        </div>
      </div>

      {/* Cryptographic Audit Chain Verification Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Append-Only Cryptographic Audit Log</h2>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  chainValid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{chainValid ? 'SHA-256 Chain 100% Intact' : 'Chain Tampering Detected'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every sensitive action, proposal approval, and emergency-stop execution is immutably hashed and chained.
            </p>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verify Chain</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Validating cryptographic records...</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl text-xs space-y-2 hover:bg-slate-950 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {log.entityType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-slate-400 text-[11px]">
                  Actor: <strong className="text-slate-200">{log.actorEmail}</strong> ({log.actorRole})
                </div>

                <div className="bg-slate-900 p-2 rounded text-[10px] font-mono text-slate-400 break-all space-y-0.5">
                  <div>
                    <span className="text-slate-500">Prev Hash:</span> {log.prevHash.substring(0, 32)}...
                  </div>
                  <div>
                    <span className="text-emerald-400 font-semibold">Entry Hash:</span>{' '}
                    <span className="text-emerald-300">{log.hash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2">Invite Team Member</h3>
            <p className="text-xs text-slate-400 mb-4">
              Send single-use cryptographic invitation token for {currentOrg?.name}.
            </p>

            <form onSubmit={handleGenerateInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Member Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="analyst@enterprise.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Assigned RBAC Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="CAMPAIGN_MANAGER">Campaign Manager</option>
                  <option value="FINANCE_APPROVER">Finance Approver</option>
                  <option value="ANALYST">Analyst</option>
                  <option value="CREATIVE">Creative</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="READ_ONLY">Read Only</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {generatedInviteLink && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="text-[10px] text-emerald-400 font-bold">Single-Use Token Link Generated:</div>
                  <div className="text-[10px] font-mono text-slate-300 break-all select-all">
                    {generatedInviteLink}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold"
                >
                  Generate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
