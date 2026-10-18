/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Palette,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Search,
  Share2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { CreativeAsset, BrandProfile, ProviderType } from '../server/db/types.js';

export const CreativeStudioView: React.FC = () => {
  const { currentOrg, permissions, showToast, authFetch } = useApp();
  const [creatives, setCreatives] = useState<CreativeAsset[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  // Form State
  const [headline, setHeadline] = useState('Scale Enterprise Campaigns with Zero Guesswork');
  const [description, setDescription] = useState(
    'Unified cross-channel ad coordination across Meta, Google, and TikTok with automated financial protection.'
  );
  const [cta, setCta] = useState('START_FREE_TRIAL');
  const [targetUrl, setTargetUrl] = useState('https://apexglobal.example.com/growth');
  const [activePreviewFormat, setActivePreviewFormat] = useState<ProviderType>('meta');
  const [copyLanguage, setCopyLanguage] = useState('en');

  const fetchCreatives = async () => {
    try {
      const res = await authFetch('/api/creatives');
      if (res.ok) {
        const data = await res.json();
        setCreatives(data.creatives || []);
        if (data.brandProfiles && data.brandProfiles.length > 0) {
          setBrandProfile(data.brandProfiles[0]);
        }
      }
    } catch {
      showToast('Error loading creative assets', 'error');
    }
  };

  useEffect(() => {
    fetchCreatives();
  }, [currentOrg]);

  // Brand Safety Scanner
  const disallowedWords = brandProfile?.disallowedKeywords || ['cheap', 'guaranteed profits', 'free crypto'];
  const detectedDisallowed = disallowedWords.filter(
    (w) =>
      headline.toLowerCase().includes(w.toLowerCase()) ||
      description.toLowerCase().includes(w.toLowerCase())
  );

  const brandSafetyScore = Math.max(20, 100 - detectedDisallowed.length * 35);

  const handleGenerateVariations = () => {
    if (copyLanguage === 'hi') {
      setHeadline('स्मार्ट एआई विज्ञापनों से अपना आरओएएस 3 गुना बढ़ाएं');
      setDescription('मेटा, गूगल और टिकटॉक अभियानों का एक ही सुरक्षित प्लेटफॉर्म पर प्रबंधन करें।');
    } else if (copyLanguage === 'es') {
      setHeadline('Escale Campañas Empresariales con Precisión Absoluta');
      setDescription('Coordinación unificada de anuncios en Meta, Google y TikTok con salvaguardas financieras.');
    } else {
      setHeadline('Accelerate Enterprise Growth with Omnichannel Ad AI');
      setDescription('Coordinate Meta, Google, and TikTok campaigns with bank-grade financial governance.');
    }
    showToast('AI copy generated for selected language', 'success');
  };

  const handleSaveCreative = async () => {
    if (!permissions.includes('MANAGE_CREATIVES')) {
      showToast('Permission denied: Requires MANAGE_CREATIVES permission.', 'error');
      return;
    }

    try {
      const res = await authFetch('/api/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${activePreviewFormat.toUpperCase()} Ad - ${headline.substring(0, 24)}...`,
          headline,
          description,
          callToAction: cta,
          targetUrl,
          platformFormats: [activePreviewFormat],
          language: copyLanguage,
        }),
      });

      if (res.ok) {
        showToast('Creative Asset approved and saved to organization library!', 'success');
        fetchCreatives();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save creative', 'error');
      }
    } catch {
      showToast('Network error saving asset', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-xl text-white shadow-lg shadow-pink-500/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Creative & Brand Studio
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-format ad production, native channel previews, brand safety scanning, and multilingual localization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Brand Kit:</span>
          <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white">
            {brandProfile?.name || 'Apex Global Brand Kit'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Copy & Format Configuration */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Ad Copy & Localized Variations
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={copyLanguage}
                  onChange={(e) => setCopyLanguage(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="en">English (EN)</option>
                  <option value="hi">हिंदी (HI)</option>
                  <option value="es">Español (ES)</option>
                  <option value="fr">Français (FR)</option>
                </select>
                <button
                  onClick={handleGenerateVariations}
                  className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-xs font-bold transition"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Headline ({headline.length} chars)
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Text / Body Description ({description.length} chars)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Call to Action</label>
                <select
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="START_FREE_TRIAL">Start Free Trial</option>
                  <option value="LEARN_MORE">Learn More</option>
                  <option value="BOOK_DEMO">Book Enterprise Demo</option>
                  <option value="GET_QUOTE">Get Quote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Landing Page</label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Brand Safety Card */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Brand Safety & Compliance Score
                </span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                    brandSafetyScore >= 80
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {brandSafetyScore}/100
                </span>
              </div>

              {detectedDisallowed.length > 0 ? (
                <div className="text-xs text-red-400 flex items-start gap-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Prohibited keywords flagged by brand guidelines: &quot;{detectedDisallowed.join(', ')}&quot;
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Passes brand tone guidelines and advertising safety checks.</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveCreative}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/20"
            >
              Save to Creative Asset Library
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Multi-Platform Ad Previews */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white">Live Platform Ad Preview</h2>
              <div className="flex gap-1">
                {(['meta', 'google', 'tiktok', 'linkedin'] as ProviderType[]).map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setActivePreviewFormat(prov)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition ${
                      activePreviewFormat === prov
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Meta Feed Card */}
            {activePreviewFormat === 'meta' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg max-w-sm mx-auto text-xs">
                {/* Meta Header */}
                <div className="p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>Apex Global Official</span>
                      <CheckCircle className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="text-[10px] text-slate-400">Sponsored • Paid Partnership</div>
                  </div>
                </div>

                {/* Primary text */}
                <div className="px-3 pb-2 text-slate-200 text-xs leading-relaxed">{description}</div>

                {/* Image Placeholder */}
                <div className="h-44 bg-slate-800 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600"
                    alt="Creative Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
                    HD 1080x1080
                  </div>
                </div>

                {/* Meta CTA Bar */}
                <div className="p-3 bg-slate-900/90 flex items-center justify-between border-t border-slate-800">
                  <div className="truncate max-w-[200px]">
                    <div className="text-[10px] text-slate-400 uppercase">apexglobal.com</div>
                    <div className="font-bold text-white text-xs truncate">{headline}</div>
                  </div>
                  <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded text-[11px] shrink-0">
                    {cta.replace(/_/g, ' ')}
                  </button>
                </div>
              </div>
            )}

            {/* 2. Google Search Card */}
            {activePreviewFormat === 'google' && (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-2 text-xs max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                    Sponsored
                  </span>
                  <span className="text-slate-400 text-[11px]">https://www.apexglobal.com</span>
                </div>
                <div className="text-blue-400 font-bold text-base hover:underline cursor-pointer">
                  {headline} | Apex Global
                </div>
                <div className="text-slate-300 text-xs leading-relaxed">{description}</div>
                <div className="flex gap-4 pt-2 text-[11px] text-blue-400">
                  <span className="hover:underline cursor-pointer">Enterprise Security</span>
                  <span className="hover:underline cursor-pointer">Live Demo</span>
                  <span className="hover:underline cursor-pointer">Pricing</span>
                </div>
              </div>
            )}

            {/* 3. TikTok In-Feed Card */}
            {activePreviewFormat === 'tiktok' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-w-xs mx-auto text-xs space-y-3 relative overflow-hidden h-72 flex flex-col justify-end text-white">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                <img
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600"
                  alt="TikTok background"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="relative z-20 space-y-2">
                  <div className="font-bold text-sm">@apexglobal_official</div>
                  <div className="text-[11px] text-slate-200 line-clamp-2">{description}</div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-300">♬ Original Audio - Apex AI</span>
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-[10px]">
                      {cta.replace(/_/g, ' ')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. LinkedIn Sponsored Content */}
            {activePreviewFormat === 'linkedin' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3 max-w-sm mx-auto">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center font-bold text-white text-xs">
                    in
                  </div>
                  <div>
                    <div className="font-bold text-white">Apex Global Enterprise</div>
                    <div className="text-[10px] text-slate-400">42,800 followers • Promoted</div>
                  </div>
                </div>
                <div className="text-slate-200 text-xs leading-relaxed">{description}</div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <div className="truncate max-w-[180px]">
                    <div className="text-white font-bold text-xs truncate">{headline}</div>
                    <div className="text-[10px] text-slate-400">apexglobal.com</div>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white font-bold rounded text-[11px]">
                    {cta.replace(/_/g, ' ')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
