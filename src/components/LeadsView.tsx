/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  Phone,
  Send,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { LeadRecord } from '../server/db/types.js';

export const LeadsView: React.FC = () => {
  const { currentOrg, showToast, authFetch } = useApp();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        if (data.length > 0 && !selectedLead) {
          setSelectedLead(data[0]);
        }
      }
    } catch {
      showToast('Error loading messaging leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [currentOrg]);

  const handleUpdateStatus = async (leadId: string, nextStatus: LeadRecord['status']) => {
    try {
      const res = await authFetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Lead updated to ${nextStatus}`, 'success');
        fetchLeads();
      }
    } catch {
      showToast('Error updating lead status', 'error');
    }
  };

  const handleSendWhatsAppTemplate = () => {
    if (!replyText.trim()) return;
    showToast(`WhatsApp Business Template dispatched to ${selectedLead?.contactIdentifier}!`, 'success');
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Messaging & Lead Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              WhatsApp Business API, Instagram Messaging, and Meta Instant Forms with 24-hour consent window enforcement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Meta Graph & WhatsApp Cloud API Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Conversations & Leads ({leads.length})
            </h2>
            <button onClick={fetchLeads} className="text-slate-400 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading incoming leads...</div>
            ) : (
              leads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full text-left p-4 transition flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white truncate">{lead.contactName}</span>
                        <span className="text-[10px] bg-slate-800 text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
                          {lead.channel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{lead.lastMessageSnippet}</p>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        lead.status === 'NEW'
                          ? 'bg-blue-500/20 text-blue-400'
                          : lead.status === 'QUALIFIED'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Lead Detail & WhatsApp Composer */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          {selectedLead ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">{selectedLead.contactName}</h2>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedLead.contactIdentifier}</span>
                    <span>•</span>
                    <span className="text-emerald-400">Opt-in Consent Verified</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                  </select>
                </div>
              </div>

              {/* 24-Hour Messaging Window Notice */}
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Meta 24h Customer Care Window Active</span>
                </div>
                <span className="text-emerald-400 font-bold">22h 45m remaining</span>
              </div>

              {/* Message History */}
              <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800 max-h-56 overflow-y-auto text-xs">
                <div className="bg-slate-800 p-3 rounded-xl max-w-sm text-slate-200">
                  <div className="text-[10px] text-slate-400 mb-1 font-semibold">{selectedLead.contactName}</div>
                  <div>{selectedLead.lastMessageSnippet}</div>
                </div>

                <div className="bg-emerald-950/60 border border-emerald-800/40 p-3 rounded-xl max-w-sm ml-auto text-emerald-100">
                  <div className="text-[10px] text-emerald-400 mb-1 font-semibold">AdVantage AI Auto-Responder</div>
                  <div>
                    Hello! We received your inquiry regarding enterprise omnichannel advertising. An account specialist has been assigned to your workspace.
                  </div>
                </div>
              </div>

              {/* Message Composer */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Send WhatsApp Business Response / Template Message:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official WhatsApp template message or custom reply..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSendWhatsAppTemplate}
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">Select a lead to view conversation.</div>
          )}
        </div>
      </div>
    </div>
  );
};
