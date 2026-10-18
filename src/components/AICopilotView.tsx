/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Sparkles,
  Send,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { CopilotResponse, CopilotRecommendation } from '../server/services/copilot.js';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendations?: CopilotRecommendation[];
  modelUsed?: string;
  disclaimer?: string;
}

const SAMPLE_PROMPTS = [
  'Compare ROAS and efficiency across Meta Ads and Google Performance Max',
  'Diagnose TikTok campaign performance and recommend creative copy',
  'Generate festive high-converting ad copy in Hindi for Meta',
  'Should we scale the daily budget for Google Ads by $1,000?',
];

export const AICopilotView: React.FC = () => {
  const { currentOrg, language, showToast, setActiveTab, authFetch } = useApp();
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: `Hello! I am your AdVantage AI Advertising Intelligence Copilot. I analyze real-time campaign performance across Meta, Google, TikTok, and LinkedIn with strict deterministic financial safeguards. How can I optimize your marketing operations today?`,
      modelUsed: 'gemini-2.5-flash',
      disclaimer: 'AI outputs are advisory recommendations only. Financial and budget changes require verified human approval under organization policy.',
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: prompt,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await authFetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language }),
      });

      const data: CopilotResponse = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.answer,
        recommendations: data.recommendations,
        modelUsed: data.modelUsed,
        disclaimer: data.disclaimer,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      showToast('Error communicating with AI Copilot', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async (rec: CopilotRecommendation) => {
    if (!rec.suggestedAction?.campaignId || !rec.suggestedAction.proposedBudgetChangeMinorUnits) {
      showToast('Recommendation noted. Redirecting to Creative Studio...', 'info');
      setActiveTab('creatives');
      return;
    }

    try {
      // Find current campaign budget
      const campRes = await authFetch('/api/campaigns');
      const camps = await campRes.json();
      const targetCamp = camps.find((c: any) => c.id === rec.suggestedAction.campaignId);

      if (!targetCamp) {
        showToast('Target campaign not found', 'error');
        return;
      }

      const mult = targetCamp.currency === 'JPY' ? 1 : 100;
      const currentMajor = targetCamp.budgetMinorUnits / mult;
      const changeMajor = rec.suggestedAction.proposedBudgetChangeMinorUnits / mult;
      const proposedMajor = currentMajor + changeMajor;

      const res = await authFetch('/api/finance/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: targetCamp.id,
          proposedBudgetAmount: proposedMajor,
          title: `AI Recommended: ${rec.title}`,
          description: rec.rationale,
          reason: `Evidence: ${rec.evidence.map((e) => `${e.metric}: ${e.value}`).join(', ')}`,
        }),
      });

      if (res.ok) {
        showToast('AI recommendation drafted and submitted to Four-Eye Approval Queue!', 'success');
        setActiveTab('finance');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to submit proposal', 'error');
      }
    } catch {
      showToast('Network error submitting AI proposal', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Advertising Copilot
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Natural language cross-network analysis powered by Gemini with deterministic security boundaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Prompt Injection Firewall Active</span>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 text-xs">
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 transition text-left text-[11px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-h-[580px] overflow-y-auto shadow-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs sm:text-sm ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md shadow-blue-500/20">
                AI
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 space-y-3 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white font-medium ml-auto'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Render Evidence-Backed Recommendations */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="pt-3 border-t border-slate-700/80 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Evidence-Backed Recommendations
                  </span>

                  {msg.recommendations.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>{rec.title}</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                          {rec.type}
                        </span>
                      </div>

                      <p className="text-slate-300 text-[11px]">{rec.rationale}</p>

                      {/* Evidence Metrics */}
                      <div className="grid grid-cols-3 gap-2 py-1">
                        {rec.evidence.map((ev, eIdx) => (
                          <div key={eIdx} className="bg-slate-800/70 p-2 rounded text-[10px]">
                            <div className="text-slate-400">{ev.metric}</div>
                            <div className="font-bold text-white">{ev.value}</div>
                            <div className="text-slate-500 text-[9px]">{ev.benchmark}</div>
                          </div>
                        ))}
                      </div>

                      {/* Caveats */}
                      <div className="text-[10px] text-amber-400/90 flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Caveat: {rec.caveats.join('. ')}</span>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleApplyRecommendation(rec)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] transition"
                        >
                          <span>Draft Approval Proposal</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {msg.disclaimer && (
                <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-700/50">
                  {msg.disclaimer}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <span>Evaluating cross-channel metrics & synthesizing evidence...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask AI Copilot about campaign ROAS, creative performance, or budget recommendations..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || loading}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Submit</span>
        </button>
      </form>
    </div>
  );
};
