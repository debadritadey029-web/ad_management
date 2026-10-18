/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext.js';
import {
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Palette,
  Network,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { TranslationDictionary } from '../i18n/translations.js';

interface NavItem {
  id: string;
  labelKey: keyof TranslationDictionary;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { id: 'campaigns', labelKey: 'campaigns', icon: Megaphone },
  { id: 'finance', labelKey: 'financialSafety', icon: ShieldCheck },
  { id: 'analytics', labelKey: 'analytics', icon: BarChart3 },
  { id: 'copilot', labelKey: 'copilot', icon: Sparkles },
  { id: 'creatives', labelKey: 'creativeStudio', icon: Palette },
  { id: 'channels', labelKey: 'channels', icon: Network },
  { id: 'leads', labelKey: 'leads', icon: MessageSquare },
  { id: 'team', labelKey: 'teamAudit', icon: Users },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, t, mobileMenuOpen, setMobileMenuOpen } = useApp();

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 md:hidden">
          <span className="font-extrabold text-sm text-white">Menu Navigation</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* Safety & Compliance Badge */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PostgreSQL & Four-Eye Active</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Deterministic RBAC, minor-unit arithmetic, and SHA-256 tamper-evident audit chaining.
          </p>
        </div>
      </aside>
    </>
  );
};
