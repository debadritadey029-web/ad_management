/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { CampaignsView } from './components/CampaignsView.js';
import { FinancialSafetyView } from './components/FinancialSafetyView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { AICopilotView } from './components/AICopilotView.js';
import { CreativeStudioView } from './components/CreativeStudioView.js';
import { ChannelsView } from './components/ChannelsView.js';
import { LeadsView } from './components/LeadsView.js';
import { TeamAuditView } from './components/TeamAuditView.js';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, toast } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'campaigns':
        return <CampaignsView />;
      case 'finance':
        return <FinancialSafetyView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'copilot':
        return <AICopilotView />;
      case 'creatives':
        return <CreativeStudioView />;
      case 'channels':
        return <ChannelsView />;
      case 'leads':
        return <LeadsView />;
      case 'team':
        return <TeamAuditView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all animate-slide-up max-w-md bg-slate-900/95 border-slate-700 text-white">
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
