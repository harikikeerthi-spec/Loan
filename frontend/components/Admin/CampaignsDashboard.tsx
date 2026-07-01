"use client";

import React, { useState, useEffect } from 'react';
import { campaignApi } from '@/lib/api';

interface CampaignStats {
  pending: number;
  sent: number;
  failed: number;
}

interface Campaign {
  id: string;
  title: string;
  templateType: string;
  tone: string;
  optimizationGoal: string;
  primaryObjective: string;
  targetContext: string;
  subject: string;
  bodyTemplate: string;
  status: 'draft' | 'queued' | 'sending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  scheduledAt: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  stats?: CampaignStats;
}

interface AudienceUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  studyDestination?: string;
  targetUniversity?: string;
}

// Pre-defined templates for Step 1
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  newsletter: {
    subject: "🎓 Stay Informed: Latest Education Updates from VidyaLoan",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #6605c7 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 26px;">VidyaLoan Newsletter</h1>
  </div>
  <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear {{firstName}},</p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6;">Here are the latest updates, tips, and insights on studying abroad and securing the best education loans:</p>
  <div style="background-color: #f8fafc; border-left: 4px solid #6605c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
    <strong style="color: #0f172a; display: block; margin-bottom: 5px;">🔥 Global Intake Updates 2026</strong>
    <span style="color: #475569; font-size: 14px;">Applications are open for top universities. Ensure your documents are synchronized via DigiLocker on your VidyaLoan portal to fast-track processing.</span>
  </div>
  <p style="color: #334155; font-size: 15px; line-height: 1.6;">Our team is here to support you at every stage of your educational journey.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://vidyaloan.in/dashboard" style="background-color: #6605c7; color: white; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(102, 5, 199, 0.2);">🚀 Visit Your Dashboard</a>
  </div>
  <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
    © 2026 VidyaLoan Technologies. All rights reserved.
  </p>
</div>`
  },
  promotional: {
    subject: "🎁 Heriot-Watt University Ramadan Community Scholarship 2026 - Save up to £5,000!",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Exclusive Partner Scholarship</h1>
  </div>
  <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear {{firstName}},</p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6;">We have exciting news! <strong>Heriot-Watt University</strong> is offering the **Ramadan Community Scholarship 2026** for students entering postgraduate programs.</p>
  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 18px;">Scholarship Summary:</h3>
    <ul style="color: #1e3a8a; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.6;">
      <li><strong>Reward:</strong> Up to £5,000 Tuition Waiver</li>
      <li><strong>Eligibility:</strong> Postgraduate applications from South Asia</li>
      <li><strong>Deadline:</strong> July 15, 2026</li>
    </ul>
  </div>
  <p style="color: #334155; font-size: 15px; line-height: 1.6;">Get a matching education loan from HDFC Credila or ICICI Bank directly via VidyaLoan to fund the remaining tuition and living costs.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://vidyaloan.in/explore" style="background-color: #3b82f6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 15px; display: inline-block;">🔍 Check Scholarship Details</a>
  </div>
</div>`
  },
  onboarding: {
    subject: "👋 Complete Your Profile and Start Matching Lenders",
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 26px;">Welcome to VidyaLoan!</h1>
  </div>
  <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear {{firstName}},</p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6;">Thank you for registering. You are just one step away from starting your education loan application.</p>
  <p style="color: #334155; font-size: 15px; line-height: 1.6;">Complete your profile dashboard and synchronize your academic credentials via DigiLocker to instantly match with 20+ partner lenders.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://vidyaloan.in/dashboard" style="background-color: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 15px; display: inline-block;">🚀 Complete Your Profile</a>
  </div>
</div>`
  }
};

export default function CampaignsDashboard() {
  const [view, setView] = useState<'list' | 'create_step1' | 'create_step2' | 'create_step3' | 'detail'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);

  // Wizard State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [templateType, setTemplateType] = useState('newsletter');
  const [tone, setTone] = useState('friendly_casual');
  const [optimizationGoal, setOptimizationGoal] = useState('');
  const [primaryObjective, setPrimaryObjective] = useState('Visit our website');
  const [targetContext, setTargetContext] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Audience State
  const [audience, setAudience] = useState<AudienceUser[]>([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');

  // Load Campaigns
  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res: any = await campaignApi.getAll(50, 0);
      if (res.success) {
        setCampaigns(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Poll for sending progress if there are active sending campaigns
  useEffect(() => {
    const hasActiveCampaigns = campaigns.some(c => c.status === 'sending' || c.status === 'queued');
    if (!hasActiveCampaigns) return;

    const interval = setInterval(() => {
      loadCampaigns();
      if (selectedCampaign && (selectedCampaign.status === 'sending' || selectedCampaign.status === 'queued')) {
        loadCampaignDetail(selectedCampaign.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [campaigns, selectedCampaign]);

  const loadCampaignDetail = async (id: string) => {
    try {
      const res: any = await campaignApi.getById(id);
      if (res.success) {
        setSelectedCampaign(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartWizard = () => {
    setTitle('');
    setSubject(DEFAULT_TEMPLATES.newsletter.subject);
    setTemplateType('newsletter');
    setTone('friendly_casual');
    setOptimizationGoal('Increase platform dashboard traffic');
    setPrimaryObjective('Visit our website');
    setTargetContext('Monthly Updates');
    setBodyTemplate(DEFAULT_TEMPLATES.newsletter.body.trim());
    setSelectedAudienceIds([]);
    setView('create_step1');
  };

  const handleTemplateTypeChange = (type: string) => {
    setTemplateType(type);
    const defaults = DEFAULT_TEMPLATES[type] || DEFAULT_TEMPLATES.newsletter;
    setSubject(defaults.subject);
    setBodyTemplate(defaults.body.trim());
  };

  const handleNextToStep2 = async () => {
    if (!title || !subject || !bodyTemplate) {
      alert('Please fill out Title, Subject, and Email Body!');
      return;
    }
    setView('create_step2');
    setLoadingAudience(true);
    try {
      const res: any = await campaignApi.getAudience();
      setAudience(res || []);
      setSelectedAudienceIds((res || []).map((u: any) => u.id)); // select all by default
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudience(false);
    }
  };

  const handleAudienceFilter = async () => {
    setLoadingAudience(true);
    try {
      const res: any = await campaignApi.getAudience({
        studyDestination: countryFilter || undefined,
        targetUniversity: universityFilter || undefined
      });
      setAudience(res || []);
      setSelectedAudienceIds((res || []).map((u: any) => u.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudience(false);
    }
  };

  const handleToggleRecipient = (id: string) => {
    setSelectedAudienceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllAudience = (checked: boolean) => {
    if (checked) {
      setSelectedAudienceIds(audience.map(u => u.id));
    } else {
      setSelectedAudienceIds([]);
    }
  };

  const handleNextToStep3 = () => {
    if (selectedAudienceIds.length === 0) {
      alert('Please select at least 1 recipient!');
      return;
    }
    setView('create_step3');
  };

  const handleConfirmAndQueue = async () => {
    setLoading(true);
    try {
      // 1. Create campaign draft
      const resCreate: any = await campaignApi.create({
        title,
        templateType,
        tone,
        optimizationGoal,
        primaryObjective,
        targetContext,
        subject,
        bodyTemplate,
        priority
      });

      if (resCreate.success && resCreate.data?.id) {
        const campaignId = resCreate.data.id;
        // 2. Queue with selected recipients
        await campaignApi.queue(campaignId, selectedAudienceIds);
        alert('Campaign successfully created and queued! Sending starts shortly.');
        setView('list');
        loadCampaigns();
      }
    } catch (e: any) {
      alert('Error creating campaign: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to cancel sending for this campaign?')) return;
    try {
      await campaignApi.cancel(id);
      loadCampaigns();
      if (selectedCampaign && selectedCampaign.id === id) {
        loadCampaignDetail(id);
      }
    } catch (e: any) {
      alert('Failed to cancel campaign: ' + e.message);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This deletes all associated metrics.')) return;
    try {
      await campaignApi.delete(id);
      setView('list');
      loadCampaigns();
    } catch (e: any) {
      alert('Failed to delete campaign: ' + e.message);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'sending': return 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse';
      case 'queued': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'cancelled': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in text-slate-800">

      {/* Overview/List View */}
      {view === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Email Campaigns</h2>
              <p className="text-slate-500 text-[11px] mt-1 font-medium">Configure target audience marketing, announcements, and track progress.</p>
            </div>
            <button
              onClick={handleStartWizard}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              New Campaign
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Campaign Name & Subject</th>
                    <th className="px-6 py-4">Template & Tone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Sending Progress</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {loading && campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                        Loading campaigns...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-35 text-slate-500">campaign</span>
                        <p className="font-semibold text-slate-600">No campaigns created yet</p>
                        <p className="text-[10px] text-slate-400 mt-1">Get started by launching a new email campaign.</p>
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((camp) => {
                      const completed = camp.sentCount + camp.failedCount;
                      const progressPct = camp.totalCount > 0 ? Math.round((completed / camp.totalCount) * 100) : 0;
                      return (
                        <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{camp.title}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">{camp.subject}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-medium uppercase tracking-wide border border-slate-200/60 mr-1.5">{camp.templateType}</span>
                            <span className="text-slate-500 capitalize">{camp.tone.replace('_', ' ')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(camp.status)}`}>
                              {camp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-40">
                              <div className="flex justify-between items-center mb-1 text-[10px] font-semibold text-slate-500">
                                <span>{completed} / {camp.totalCount} sent</span>
                                <span>{progressPct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${camp.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCampaign(camp);
                                  setView('detail');
                                  loadCampaignDetail(camp.id);
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[10px] font-semibold text-slate-700 shadow-sm"
                              >
                                View Details
                              </button>
                              {(camp.status === 'sending' || camp.status === 'queued') && (
                                <button
                                  onClick={() => handleCancelCampaign(camp.id)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-[10px] font-semibold text-rose-600"
                                >
                                  Cancel
                                </button>
                              )}
                              {(camp.status === 'draft' || camp.status === 'completed' || camp.status === 'cancelled') && (
                                <button
                                  onClick={() => handleDeleteCampaign(camp.id)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 rounded text-[10px] font-semibold text-slate-600 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Step 1: Configuration */}
      {view === 'create_step1' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Campaign - Step 1: Configuration</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Configure template parameters, subject, objective, and content structure.</p>
            </div>
            <button
              onClick={() => setView('list')}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramadan Scholarship Campaign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Template Type</label>
                <select
                  value={templateType}
                  onChange={(e) => handleTemplateTypeChange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs capitalize"
                >
                  <option value="newsletter">Newsletter</option>
                  <option value="promotional">Promotional Offer</option>
                  <option value="onboarding">Onboarding Welcome</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tone & Styling</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                >
                  <option value="friendly_casual">Friendly & Casual</option>
                  <option value="urgent_action_oriented">Urgent & Action-Oriented</option>
                  <option value="exclusive_premium">Exclusive & Premium</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Primary Objective</label>
                <input
                  type="text"
                  value={primaryObjective}
                  onChange={(e) => setPrimaryObjective(e.target.value)}
                  placeholder="e.g. Visit our website"
                  className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Target Context (Optional)</label>
                <input
                  type="text"
                  value={targetContext}
                  onChange={(e) => setTargetContext(e.target.value)}
                  placeholder="e.g. Heriot-Watt University Ramadan Scholarship"
                  className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Optimization Goal</label>
                <input
                  type="text"
                  value={optimizationGoal}
                  onChange={(e) => setOptimizationGoal(e.target.value)}
                  placeholder="e.g. Increase loan application submissions"
                  className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-slate-100 pt-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Email Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email Subject Line (supports {{firstName}})"
                className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Email Body (HTML Template)</label>
              <textarea
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                placeholder="Paste your HTML content template here..."
                rows={12}
                className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
              />
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
              <span className="text-[10px] text-slate-400 font-medium">💡 Variables available: <code>{"{{firstName}}"}</code>, <code>{"{{lastName}}"}</code></span>
              <button
                onClick={handleNextToStep2}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-sm"
              >
                Next: Select Audience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Audience */}
      {view === 'create_step2' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Campaign - Step 2: Select Audience</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Filter students by destination country/university and select recipients.</p>
            </div>
            <button
              onClick={() => setView('create_step1')}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold"
            >
              Back
            </button>
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4 items-end">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Study Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Ireland"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Target University</label>
                <input
                  type="text"
                  placeholder="e.g. Atlantic Technological University"
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>
            <button
              onClick={handleAudienceFilter}
              className="px-4 py-2 bg-slate-900 text-white rounded text-[11px] font-bold h-[34px]"
            >
              Apply Filter
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={audience.length > 0 && selectedAudienceIds.length === audience.length}
                  onChange={(e) => handleSelectAllAudience(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-[11px] font-semibold text-slate-700">Select All Students ({audience.length})</span>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100">
                {selectedAudienceIds.length} Selected
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
              {loadingAudience ? (
                <div className="p-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                  Fetching students...
                </div>
              ) : audience.length === 0 ? (
                <div className="p-12 text-center text-slate-400">No students matched these filters.</div>
              ) : (
                audience.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleToggleRecipient(user.id)}
                    className={`px-5 py-3 cursor-pointer hover:bg-slate-50/50 flex items-center justify-between transition-colors ${selectedAudienceIds.includes(user.id) ? 'bg-indigo-50/20' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAudienceIds.includes(user.id)}
                        onChange={() => { }} // handled by div onClick
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{user.firstName || 'Student'} {user.lastName || ''}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{user.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {user.studyDestination && (
                        <div className="text-[10px] font-semibold text-indigo-600">{user.studyDestination}</div>
                      )}
                      {user.targetUniversity && (
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-xs">{user.targetUniversity}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={handleNextToStep3}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-sm"
              >
                Next: Preview & Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Queue */}
      {view === 'create_step3' && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Campaign - Step 3: Preview</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Preview generated template and review sending configurations.</p>
            </div>
            <button
              onClick={() => setView('create_step2')}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold"
            >
              Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Email HTML Preview */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Preview</h3>
              <div className="border border-slate-200 rounded-xl bg-white p-4">
                <div className="border-b border-slate-100 pb-3 mb-4 text-[11px] text-slate-500 space-y-1">
                  <div><strong>From:</strong> VidyaLoan Notifications &lt;noreply@vidyaloan.com&gt;</div>
                  <div><strong>Subject:</strong> {subject.replace('{{firstName}}', audience[0]?.firstName || 'Student')}</div>
                </div>
                {/* HTML content inside border frame */}
                <div
                  className="overflow-y-auto max-h-[450px] p-2 bg-slate-50/50 rounded border border-slate-100"
                  dangerouslySetInnerHTML={{ __html: bodyTemplate.replace('{{firstName}}', audience[0]?.firstName || 'Student').replace('{{lastName}}', audience[0]?.lastName || '') }}
                />
              </div>
            </div>

            {/* Right: Campaign Configuration Details */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Campaign Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Recipients</span>
                    <span className="font-bold text-slate-900">{selectedAudienceIds.length} Selected</span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Template</span>
                    <span className="font-bold text-slate-900 uppercase">{templateType}</span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                    <span className="text-slate-400">Tone</span>
                    <span className="font-bold text-slate-900 capitalize">{tone.replace('_', ' ')}</span>
                  </div>

                  <div className="flex flex-col gap-1 border-b border-slate-50 pb-2 text-xs">
                    <span className="text-slate-400">Priority Level</span>
                    <div className="flex gap-2 mt-1">
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          className={`flex-1 py-1 rounded text-[9px] uppercase tracking-wider font-bold border transition-all ${priority === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Scheduled For</span>
                    <span className="font-bold text-emerald-600">Immediate Send</span>
                  </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-[10px] text-indigo-700 leading-relaxed">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1.5 text-indigo-600">info</span>
                  Emails are processed in throttled batches of **10 emails every 30 seconds** to maintain SMTP health and deliverability metrics.
                </div>

                <button
                  onClick={handleConfirmAndQueue}
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200/50"
                >
                  {loading ? 'Queueing...' : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      Confirm & Queue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail View */}
      {view === 'detail' && selectedCampaign && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campaign Details: {selectedCampaign.title}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">ID: <code>{selectedCampaign.id}</code></p>
            </div>
            <button
              onClick={() => setView('list')}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold"
            >
              Back to List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left: General Stats */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm md:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Delivery Metrics</h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
                  <p className="text-xl font-bold">{selectedCampaign.totalCount}</p>
                  <p className="text-[9px] font-black uppercase mt-0.5 opacity-80">Total</p>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                  <p className="text-xl font-bold">{selectedCampaign.sentCount}</p>
                  <p className="text-[9px] font-black uppercase mt-0.5 opacity-80">Sent</p>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700">
                  <p className="text-xl font-bold">{selectedCampaign.failedCount}</p>
                  <p className="text-[9px] font-black uppercase mt-0.5 opacity-80">Failed</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Status</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(selectedCampaign.status)}`}>
                    {selectedCampaign.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Priority</span>
                  <span className="font-bold text-slate-700 uppercase">{selectedCampaign.priority}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Tone</span>
                  <span className="font-bold text-slate-700 capitalize">{selectedCampaign.tone.replace('_', ' ')}</span>
                </div>
              </div>

              {selectedCampaign.status === 'sending' && (
                <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl p-3 text-[10px] text-center font-bold">
                  ⚡ Processing batch queues (10 / 30s)
                </div>
              )}
            </div>

            {/* Right: Email content preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm md:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Configuration</h3>

              <div className="text-xs space-y-2 border-b border-slate-100 pb-3 mb-3">
                <div><strong>Subject:</strong> {selectedCampaign.subject}</div>
                {selectedCampaign.optimizationGoal && (
                  <div><strong>Optimization Goal:</strong> {selectedCampaign.optimizationGoal}</div>
                )}
                {selectedCampaign.primaryObjective && (
                  <div><strong>Primary Objective:</strong> {selectedCampaign.primaryObjective}</div>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">HTML Template Structure</p>
                <div
                  className="max-h-[250px] overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded text-xs"
                  dangerouslySetInnerHTML={{ __html: selectedCampaign.bodyTemplate.replace('{{firstName}}', 'Student').replace('{{lastName}}', '') }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
