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
  sessionToken: string | null;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
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
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('advantage_session_token') || 'test_token_sarah_apex';
  });

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(init.headers || {});
      if (sessionToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${sessionToken}`);
      }
      if (currentOrg?.id && !headers.has('x-organization-id')) {
        headers.set('x-organization-id', currentOrg.id);
      }
      return fetch(url, { ...init, headers });
    },
    [sessionToken, currentOrg?.id]
  );

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const refreshContext = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      const res = await fetch('/api/auth/context', { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCurrentOrg(data.currentOrg);
        setMembership(data.membership);
        setPermissions(data.permissions || []);
        setAvailableUsers(data.availableUsers || []);
        setAvailableOrgs(data.availableOrgs || []);
        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
          localStorage.setItem('advantage_session_token', data.sessionToken);
        }
      }
    } catch (err) {
      console.error('Failed to load auth context:', err);
      showToast('Error connecting to backend services', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, showToast]);

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
      const res = await authFetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, orgId: currentOrg?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setSessionToken(data.token);
          localStorage.setItem('advantage_session_token', data.token);
        }
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
      const res = await authFetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      if (res.ok) {
        await refreshContext();
        showToast('Switched organization workspace', 'success');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to switch organization', 'error');
      }
    } catch {
      showToast('Failed to switch organization', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEmergencyStop = async (reason: string) => {
    try {
      const res = await authFetch('/api/finance/emergency-stop', {
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
      const res = await authFetch('/api/finance/emergency-stop', {
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
        sessionToken,
        authFetch,
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
