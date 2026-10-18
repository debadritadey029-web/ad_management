/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TRANSLATIONS, SupportedLanguage, TranslationDictionary } from '../i18n/translations.js';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: string;
  defaultCurrency: string;
  emergencyStopActive: boolean;
  emergencyStopReason?: string;
  emergencyStopTriggeredBy?: string;
  settings: {
    budgetChangeApprovalThresholdMinorUnits: number;
    dailySpendCeilingMinorUnits: number;
    monthlySpendCeilingMinorUnits: number;
    requireFourEyesApproval: boolean;
    brandSafetyStrictness: string;
  };
}

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  role: string;
  status: string;
}

interface AppContextType {
  user: User | null;
  currentOrg: Organization | null;
  membership: Membership | null;
  permissions: string[];
  availableUsers: User[];
  availableOrgs: Organization[];
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dir: 'ltr' | 'rtl';
  t: (key: keyof TranslationDictionary) => string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  switchUser: (userId: string) => Promise<void>;
  switchOrg: (orgId: string) => Promise<void>;
  triggerEmergencyStop: (reason: string) => Promise<void>;
  releaseEmergencyStop: () => Promise<void>;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshContext: () => Promise<void>;
  isLoading: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const refreshContext = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/context');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCurrentOrg(data.currentOrg);
        setMembership(data.membership);
        setPermissions(data.permissions || []);
        setAvailableUsers(data.availableUsers || []);
        setAvailableOrgs(data.availableOrgs || []);
      }
    } catch (err) {
      console.error('Failed to load auth context:', err);
      showToast('Error connecting to backend services', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const dir: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';

  const t = (key: keyof TranslationDictionary): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  const switchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await refreshContext();
        showToast('Switched user profile successfully', 'success');
      }
    } catch {
      showToast('Failed to switch user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrg = async (orgId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      if (res.ok) {
        await refreshContext();
        showToast('Switched organization workspace', 'success');
      }
    } catch {
      showToast('Failed to switch organization', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEmergencyStop = async (reason: string) => {
    try {
      const res = await fetch('/api/finance/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRIGGER', reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to trigger emergency stop', 'error');
        return;
      }
      await refreshContext();
      showToast('EMERGENCY STOP TRIGGERED: All outbound provider writes halted.', 'error');
    } catch {
      showToast('Network error triggering emergency stop', 'error');
    }
  };

  const releaseEmergencyStop = async () => {
    try {
      const res = await fetch('/api/finance/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RELEASE' }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to release emergency stop', 'error');
        return;
      }
      await refreshContext();
      showToast('Emergency Stop released. Normal operational safeguards restored.', 'success');
    } catch {
      showToast('Network error releasing emergency stop', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentOrg,
        membership,
        permissions,
        availableUsers,
        availableOrgs,
        language,
        setLanguage,
        dir,
        t,
        activeTab,
        setActiveTab,
        switchUser,
        switchOrg,
        triggerEmergencyStop,
        releaseEmergencyStop,
        toast,
        showToast,
        refreshContext,
        isLoading,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
