/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  UserCheck,
  Globe,
  AlertTriangle,
  Database,
  X,
  Menu,
} from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations.js';

export const Navbar: React.FC = () => {
  const {
    user,
    currentOrg,
    membership,
    availableUsers,
    availableOrgs,
    language,
    setLanguage,
    t,
    switchUser,
    switchOrg,
    triggerEmergencyStop,
    releaseEmergencyStop,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useApp();

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');

  const isEmergency = currentOrg?.emergencyStopActive;

  const handleEmergencyAction = () => {
    if (isEmergency) {
      releaseEmergencyStop();
      setShowEmergencyModal(false);
    } else {
      if (!emergencyReason.trim()) return;
      triggerEmergencyStop(emergencyReason);
      setShowEmergencyModal(false);
      setEmergencyReason('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        {/* Emergency Stop Banner if active */}
        {isEmergency && (
          <div className="bg-red-600 px-4 py-2 text-white font-semibold text-xs sm:text-sm flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{t('emergencyStopActive')}</span>
              {currentOrg?.emergencyStopReason && (
                <span className="hidden md:inline font-normal opacity-90">
                  — Reason: &quot;{currentOrg.emergencyStopReason}&quot; (Triggered by {currentOrg.emergencyStopTriggeredBy})
                </span>
              )}
            </div>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="bg-white text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-100 transition shadow"
            >
              Manage Killswitch
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center font-black text-lg sm:text-xl shadow-lg shadow-blue-500/20">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {t('appName')}
                </span>
                <span className="hidden sm:inline bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                  ENTERPRISE
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 font-medium">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Controls: Org, User/Role, Language, Emergency Stop */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Organization Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <select
                aria-label="Switch active organization"
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                value={currentOrg?.id || ''}
                onChange={(e) => switchOrg(e.target.value)}
              >
                {availableOrgs.map((org) => (
                  <option key={org.id} value={org.id} className="bg-slate-900 text-slate-200">
                    {org.name} ({org.defaultCurrency})
                  </option>
                ))}
              </select>
            </div>

            {/* Actor Switcher (RBAC Tester) */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col text-left">
                <select
                  aria-label="Switch active user and RBAC role"
                  className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                  value={user?.id || ''}
                  onChange={(e) => switchUser(e.target.value)}
                >
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="bg-slate-700 text-emerald-300 font-semibold text-[10px] px-1.5 py-0.5 rounded ml-1">
                {membership?.role || 'VIEWER'}
              </span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Select interface language"
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer uppercase text-xs"
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              >
                <option value="en" className="bg-slate-900 text-slate-200">English (EN)</option>
                <option value="hi" className="bg-slate-900 text-slate-200">हिंदी (HI)</option>
                <option value="es" className="bg-slate-900 text-slate-200">Español (ES)</option>
                <option value="fr" className="bg-slate-900 text-slate-200">Français (FR)</option>
                <option value="ar" className="bg-slate-900 text-slate-200">العربية (AR)</option>
              </select>
            </div>

            {/* Emergency Stop Killswitch Button */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              aria-label={isEmergency ? 'Release Emergency Stop' : 'Trigger Emergency Stop'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                isEmergency
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-bounce'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {isEmergency ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isEmergency ? t('emergencyStop') : t('emergencyStop')}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Emergency Stop Confirmation Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${isEmergency ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {isEmergency ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isEmergency ? t('releaseEmergencyStop') : t('triggerEmergencyStop')}
                </h3>
                <p className="text-xs text-slate-400">
                  Central Financial Safety Safeguard
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {isEmergency
                ? 'Releasing the Emergency Stop will re-enable outbound provider write operations and restore normal proposal execution workflows under standard four-eye controls.'
                : 'Activating Emergency Stop immediately halts all active campaign spend adjustments, revokes pending write executions across Meta, Google, TikTok, and LinkedIn, and flags all financial operations.'}
            </p>

            {!isEmergency && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Emergency Stop (Logged to Cryptographic Audit Chain):
                </label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  rows={3}
                  placeholder="e.g. Unusual traffic anomaly detected, unauthorized budget escalation, or pacing verification."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyAction}
                disabled={!isEmergency && !emergencyReason.trim()}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition text-white ${
                  isEmergency
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                }`}
              >
                {isEmergency ? 'Confirm Release' : 'Confirm Killswitch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
