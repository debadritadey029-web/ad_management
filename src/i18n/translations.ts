/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SupportedLanguage = 'en' | 'hi' | 'es' | 'fr' | 'ar';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  emergencyStop: string;
  emergencyStopActive: string;
  emergencyStopInactive: string;
  triggerEmergencyStop: string;
  releaseEmergencyStop: string;
  emergencyStopDesc: string;
  dashboard: string;
  campaigns: string;
  financialSafety: string;
  approvals: string;
  analytics: string;
  copilot: string;
  creativeStudio: string;
  channels: string;
  leads: string;
  teamAudit: string;
  activeRole: string;
  switchOrg: string;
  switchUser: string;
  spend: string;
  revenue: string;
  roas: string;
  conversions: string;
  ctr: string;
  cpc: string;
  cpa: string;
  dailyBudget: string;
  actions: string;
  status: string;
  approve: string;
  reject: string;
  pendingReview: string;
  brandSafety: string;
  auditVerified: string;
  exportCsv: string;
  newCampaign: string;
  submitProposal: string;
  askCopilotPlaceholder: string;
  fourEyesNotice: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'AdVantage AI',
    tagline: 'Enterprise AI Advertising Management Platform',
    emergencyStop: 'Emergency Stop',
    emergencyStopActive: 'EMERGENCY STOP ACTIVE — ALL PROVIDER WRITES HALTED',
    emergencyStopInactive: 'Financial Protection Active (Normal)',
    triggerEmergencyStop: 'Trigger Emergency Killswitch',
    releaseEmergencyStop: 'Release Emergency Stop',
    emergencyStopDesc: 'Immediately pauses campaigns and halts all outbound ad provider API writes.',
    dashboard: 'Dashboard',
    campaigns: 'Campaigns',
    financialSafety: 'Financial Safety',
    approvals: 'Approval Queue',
    analytics: 'Analytics & Reports',
    copilot: 'AI Copilot',
    creativeStudio: 'Creative Studio',
    channels: 'Channels & Providers',
    leads: 'Messaging & Leads',
    teamAudit: 'Team & Audit',
    activeRole: 'Current Role',
    switchOrg: 'Switch Organization',
    switchUser: 'Switch User (RBAC)',
    spend: 'Total Spend',
    revenue: 'Attributed Revenue',
    roas: 'Target ROAS',
    conversions: 'Conversions',
    ctr: 'Click-Through Rate',
    cpc: 'Cost Per Click',
    cpa: 'Cost Per Acquisition',
    dailyBudget: 'Daily Budget',
    actions: 'Actions',
    status: 'Status',
    approve: 'Approve & Execute',
    reject: 'Reject Proposal',
    pendingReview: 'Pending 4-Eye Review',
    brandSafety: 'Brand Safety Score',
    auditVerified: 'Cryptographic Chain Verified',
    exportCsv: 'Export CSV',
    newCampaign: 'Create Campaign',
    submitProposal: 'Submit Budget Proposal',
    askCopilotPlaceholder: 'Ask AI Copilot about campaign performance, ROAS, pacing, or copy...',
    fourEyesNotice: 'Four-Eyes Principle: Requester cannot approve their own financial adjustments.',
  },
  hi: {
    appName: 'एडवांटेज एआई',
    tagline: 'एंटरप्राइज एआई विज्ञापन प्रबंधन मंच',
    emergencyStop: 'इमरजेंसी स्टॉप',
    emergencyStopActive: 'इमरजेंसी स्टॉप सक्रिय — सभी विज्ञापन लेखन रोके गए',
    emergencyStopInactive: 'वित्तीय सुरक्षा सक्रिय (सामान्य)',
    triggerEmergencyStop: 'इमरजेंसी किलस्विच ट्रिगर करें',
    releaseEmergencyStop: 'इमरजेंसी स्टॉप हटाएं',
    emergencyStopDesc: 'अभियानों को तुरंत रोकता है और सभी प्रदाता एपीआई लिखतों को रोकता है।',
    dashboard: 'डैशबोर्ड',
    campaigns: 'अभियान (Campaigns)',
    financialSafety: 'वित्तीय सुरक्षा',
    approvals: 'अनुमोदन कतार',
    analytics: 'एनालिटिक्स व रिपोर्ट्स',
    copilot: 'एआई कोपायलट',
    creativeStudio: 'क्रिएटिव स्टूडियो',
    channels: 'चैनल व प्रदाता',
    leads: 'मैसेजिंग व लीड्स',
    teamAudit: 'टीम व ऑडिट',
    activeRole: 'सक्रिय भूमिका',
    switchOrg: 'संगठन बदलें',
    switchUser: 'उपयोगकर्ता बदलें (RBAC)',
    spend: 'कुल व्यय',
    revenue: 'सकल राजस्व',
    roas: 'आरओएएस (ROAS)',
    conversions: 'रूपांतरण (Conversions)',
    ctr: 'सीटीआर (CTR)',
    cpc: 'लागत प्रति क्लिक (CPC)',
    cpa: 'लागत प्रति अधिग्रहण (CPA)',
    dailyBudget: 'दैनिक बजट',
    actions: 'कार्रवाइयां',
    status: 'स्थिति',
    approve: 'स्वीकृत और निष्पादित करें',
    reject: 'प्रस्ताव अस्वीकार करें',
    pendingReview: 'समीक्षा लंबित (4-Eyes)',
    brandSafety: 'ब्रांड सुरक्षा स्कोर',
    auditVerified: 'क्रिप्टोग्राफिक ऑडिट चेन सत्यापित',
    exportCsv: 'सीएसवी निर्यात',
    newCampaign: 'नया अभियान बनाएं',
    submitProposal: 'बजट प्रस्ताव जमा करें',
    askCopilotPlaceholder: 'अभियान प्रदर्शन, आरओएएस या रचनात्मक कॉपी के बारे में पूछें...',
    fourEyesNotice: 'चार-आंखों का नियम: अनुरोधकर्ता स्वयं के वित्तीय प्रस्ताव को स्वीकृत नहीं कर सकता।',
  },
  es: {
    appName: 'AdVantage AI',
    tagline: 'Plataforma Empresarial de Gestión Publicitaria con IA',
    emergencyStop: 'Parada de Emergencia',
    emergencyStopActive: 'PARADA DE EMERGENCIA ACTIVA — TODAS LAS ESCRITURAS DETENIDAS',
    emergencyStopInactive: 'Protección Financiera Activa (Normal)',
    triggerEmergencyStop: 'Activar Parada de Emergencia',
    releaseEmergencyStop: 'Reanudar Operaciones',
    emergencyStopDesc: 'Pausa campañas y bloquea llamadas API de escritura inmediatamente.',
    dashboard: 'Panel',
    campaigns: 'Campañas',
    financialSafety: 'Seguridad Financiera',
    approvals: 'Cola de Aprobaciones',
    analytics: 'Analítica e Informes',
    copilot: 'Copiloto de IA',
    creativeStudio: 'Estudio Creativo',
    channels: 'Canales y Proveedores',
    leads: 'Mensajería y Clientes',
    teamAudit: 'Equipo y Auditoría',
    activeRole: 'Rol Actual',
    switchOrg: 'Cambiar Organización',
    switchUser: 'Cambiar Usuario',
    spend: 'Gasto Total',
    revenue: 'Ingresos Atribuidos',
    roas: 'ROAS Objetivo',
    conversions: 'Conversiones',
    ctr: 'CTR',
    cpc: 'CPC',
    cpa: 'CPA',
    dailyBudget: 'Presupuesto Diario',
    actions: 'Acciones',
    status: 'Estado',
    approve: 'Aprobar y Ejecutar',
    reject: 'Rechazar Propuesta',
    pendingReview: 'Revisión Pendiente',
    brandSafety: 'Puntuación de Seguridad de Marca',
    auditVerified: 'Cadena Criptográfica Verificada',
    exportCsv: 'Exportar CSV',
    newCampaign: 'Crear Campaña',
    submitProposal: 'Enviar Propuesta de Presupuesto',
    askCopilotPlaceholder: 'Pregunte al copiloto sobre rendimiento, ROAS o creatividades...',
    fourEyesNotice: 'Principio de cuatro ojos: El solicitante no puede autoaprobar presupuestos.',
  },
  fr: {
    appName: 'AdVantage AI',
    tagline: 'Plateforme Entreprise de Gestion Publicitaire par IA',
    emergencyStop: 'Arrêt d’Urgence',
    emergencyStopActive: 'ARRÊT D’URGENCE ACTIF — ÉCRITURES FOURNISSEURS SUSPENDUES',
    emergencyStopInactive: 'Sécurité Financière Active (Normale)',
    triggerEmergencyStop: 'Déclencher l’Arrêt d’Urgence',
    releaseEmergencyStop: 'Rétablir les Opérations',
    emergencyStopDesc: 'Met immédiatement en pause les campagnes et bloque les modifications API.',
    dashboard: 'Tableau de Bord',
    campaigns: 'Campagnes',
    financialSafety: 'Sécurité Financière',
    approvals: 'File d’Attente d’Approbation',
    analytics: 'Analytique & Rapports',
    copilot: 'Copilote IA',
    creativeStudio: 'Studio Créatif',
    channels: 'Canaux & Plateformes',
    leads: 'Messagerie & Prospects',
    teamAudit: 'Équipe & Audit',
    activeRole: 'Rôle Actuel',
    switchOrg: 'Changer d’Organisation',
    switchUser: 'Changer d’Utilisateur',
    spend: 'Dépenses Totales',
    revenue: 'Revenus Attribués',
    roas: 'ROAS Cible',
    conversions: 'Conversions',
    ctr: 'Taux de Clic (CTR)',
    cpc: 'Coût Par Clic (CPC)',
    cpa: 'Coût Par Acquisition',
    dailyBudget: 'Budget Quotidien',
    actions: 'Actions',
    status: 'Statut',
    approve: 'Approuver & Exécuter',
    reject: 'Rejeter la Proposition',
    pendingReview: 'En Attente de Validation',
    brandSafety: 'Score de Sécurité de Marque',
    auditVerified: 'Chaîne Cryptographique Vérifiée',
    exportCsv: 'Exporter en CSV',
    newCampaign: 'Créer une Campagne',
    submitProposal: 'Proposer un Budget',
    askCopilotPlaceholder: 'Interrogez le copilote sur les performances, le ROAS ou les visuels...',
    fourEyesNotice: 'Principe des 4 yeux : Le demandeur ne peut pas approuver son propre budget.',
  },
  ar: {
    appName: 'أدفانتج للذكاء الاصطناعي',
    tagline: 'منصة المؤسسات لإدارة الإعلانات بالذكاء الاصطناعي',
    emergencyStop: 'إيقاف الطوارئ',
    emergencyStopActive: 'إيقاف الطوارئ نشط — تم إيقاف جميع عمليات الكتابة في المنصات',
    emergencyStopInactive: 'الحماية المالية نشطة (طبيعي)',
    triggerEmergencyStop: 'تفعيل إيقاف الطوارئ',
    releaseEmergencyStop: 'إلغاء إيقاف الطوارئ',
    emergencyStopDesc: 'يوقف الحملات فوراً ويمنع كتابة أي تعديلات عبر واجهات برمجة التطبيقات.',
    dashboard: 'لوحة التحكم',
    campaigns: 'الحملات الإعلانية',
    financialSafety: 'السلامة المالية',
    approvals: 'طابور الموافقات',
    analytics: 'التحليلات والتقارير',
    copilot: 'المساعد الذكي',
    creativeStudio: 'استوديو الإبداع',
    channels: 'القنوات والمنصات',
    leads: 'الرسائل والعملاء المحتملين',
    teamAudit: 'الفريق والتدقيق',
    activeRole: 'الدور النشط',
    switchOrg: 'تبديل المؤسسة',
    switchUser: 'تبديل المستخدم',
    spend: 'إجمالي الإنفاق',
    revenue: 'الإيرادات المحققة',
    roas: 'العائد على الإنفاق (ROAS)',
    conversions: 'التحويلات',
    ctr: 'معدل النقر (CTR)',
    cpc: 'تكلفة النقرة (CPC)',
    cpa: 'تكلفة الاكتساب (CPA)',
    dailyBudget: 'الميزانية اليومية',
    actions: 'الإجراءات',
    status: 'الحالة',
    approve: 'الموافقة والتنفيذ',
    reject: 'رفض المقترح',
    pendingReview: 'في انتظار المراجعة الرباعية',
    brandSafety: 'درجة أمان العلامة التجارية',
    auditVerified: 'سلسلة التدقيق المشفرة موثقة',
    exportCsv: 'تصدير CSV',
    newCampaign: 'إنشاء حملة جديدة',
    submitProposal: 'تقديم مقترح ميزانية',
    askCopilotPlaceholder: 'اسأل المساعد الذكي عن أداء الحملات أو الميزانيات أو النصوص الإعلانية...',
    fourEyesNotice: 'مبدأ الأعين الأربع: لا يمكن لمقدم الطلب اعتماد تعديلاته المالية بنفسه.',
  },
};
