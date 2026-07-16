import React, { useState, useEffect } from 'react';
import { campaignApi } from '@/lib/api';
import { format } from 'date-fns';

interface CampaignsDashboardProps {
  activeSubmenu: string;
  setActiveSubmenu: (submenu: string) => void;
}

export default function CampaignsDashboard({ activeSubmenu, setActiveSubmenu }: CampaignsDashboardProps) {
  // --- General States ---
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // --- Summary / Stats States ---
  const [overviewStats, setOverviewStats] = useState<any>({
    totalCampaigns: 0,
    totalRecipients: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    failed: 0,
    openRate: 0,
    clickRate: 0,
  });

  // --- Wizard States (Create Campaign) ---
  const [wizardStep, setWizardStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('Boost Masters loan conversion');
  const [campaignType, setCampaignType] = useState('Scholarship Update');
  const [priority, setPriority] = useState('medium');
  const [tone, setTone] = useState('Conversational');
  const [emailLength, setEmailLength] = useState('medium');
  const [ctaText, setCtaText] = useState('Apply Now');
  const [language, setLanguage] = useState('English');
  const [brandName, setBrandName] = useState('VidyaLoan');
  const [subjectLine, setSubjectLine] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  // --- Device Preview ---
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [testEmailAddress, setTestEmailAddress] = useState('admin@vidyaloan.com');
  const [sendingTest, setSendingTest] = useState(false);

  // --- Audience Selection States ---
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savedAudiences, setSavedAudiences] = useState<any[]>([]);
  const [newAudienceName, setNewAudienceName] = useState('');

  // Filters State (AND/OR construction)
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterLoanStatus, setFilterLoanStatus] = useState('');
  const [filterAdmitStatus, setFilterAdmitStatus] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');

  // --- Templates States ---
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateSubject, setNewTemplateSubject] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // --- Automation States ---
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleEvent, setNewRuleEvent] = useState('Application Submitted');
  const [newRuleTemplateId, setNewRuleTemplateId] = useState('');
  const [creatingRule, setCreatingRule] = useState(false);

  // --- Prompt History State ---
  const [promptHistory, setPromptHistory] = useState<any[]>([]);

  // ─── Loading Side Effects ──────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubmenu === 'campaigns_dashboard' || activeSubmenu === 'campaigns_scheduled' || activeSubmenu === 'campaigns_queued' || activeSubmenu === 'campaigns_sent') {
        let statusFilter = undefined;
        if (activeSubmenu === 'campaigns_scheduled') statusFilter = 'scheduled';
        if (activeSubmenu === 'campaigns_queued') statusFilter = 'queued';
        if (activeSubmenu === 'campaigns_sent') statusFilter = 'completed';

        const res: any = await campaignApi.getAll(50, 0, statusFilter);
        if (res.success) setCampaigns(res.data || []);
      }

      if (activeSubmenu === 'campaigns_dashboard' || activeSubmenu === 'campaigns_analytics') {
        const resStats: any = await campaignApi.getOverviewStats();
        if (resStats.success) setOverviewStats(resStats.data);
      }

      if (activeSubmenu === 'campaigns_templates') {
        const res: any = await campaignApi.getTemplates();
        if (res.success) setTemplates(res.data || []);
      }

      if (activeSubmenu === 'campaigns_audience') {
        const res: any = await campaignApi.getSavedAudiences();
        if (res.success) setSavedAudiences(res.data || []);
      }

      if (activeSubmenu === 'campaigns_automation') {
        const [rulesRes, tempRes]: any[] = await Promise.all([
          campaignApi.getAutomationRules(),
          campaignApi.getTemplates(),
        ]);
        if (rulesRes.success) setAutomationRules(rulesRes.data || []);
        if (tempRes.success) setTemplates(tempRes.data || []);
      }

      if (activeSubmenu === 'campaigns_prompts') {
        const res: any = await campaignApi.getPromptHistory();
        if (res.success) setPromptHistory(res.data || []);
      }
    } catch (err) {
      console.error('Error loading campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Reset wizard steps when active section changes
    if (activeSubmenu !== 'campaigns_create') {
      setWizardStep(1);
    }
  }, [activeSubmenu]);

  // Poll for queued/sending progress updates
  useEffect(() => {
    const activeProgress = campaigns.some(c => c.status === 'sending' || c.status === 'queued');
    if (!activeProgress) return;

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [campaigns]);

  // ─── Creating / Wizard Functions ──────────────────────────────────────────

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const res: any = await campaignApi.generate({
        optimizationGoal: campaignGoal,
        primaryObjective: ctaText,
        targetContext: campaignName,
        tone,
        emailLength,
        language,
        brand: brandName,
        cta: ctaText,
      });

      if (res.success && res.data) {
        setSubjectLine(res.data.subject);
        setEmailBody(res.data.bodyTemplate);
      } else {
        alert('AI Email generation failed.');
      }
    } catch (err: any) {
      alert('AI Generation Error: ' + err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleApplyAudienceFilters = async () => {
    setLoadingStudents(true);
    try {
      const filters = {
        studyDestination: filterCountry || undefined,
        targetUniversity: filterUniversity || undefined,
        courseName: filterCourse || undefined,
        loanStatus: filterLoanStatus || undefined,
        admitStatus: filterAdmitStatus || undefined,
        minEligibilityScore: filterMinScore || undefined,
      };

      const res: any = await campaignApi.getAudience(filters);
      setStudents(res || []);
      setSelectedStudentIds((res || []).map((s: any) => s.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSaveSegment = async () => {
    if (!newAudienceName) {
      alert('Please enter a name for the audience segment.');
      return;
    }
    try {
      const filters = {
        studyDestination: filterCountry,
        targetUniversity: filterUniversity,
        courseName: filterCourse,
        loanStatus: filterLoanStatus,
        admitStatus: filterAdmitStatus,
        minEligibilityScore: filterMinScore,
      };

      const res: any = await campaignApi.saveAudience({
        name: newAudienceName,
        description: `Filtered by: Country=${filterCountry || 'All'}, Univ=${filterUniversity || 'All'}`,
        filters,
      });

      if (res.success) {
        alert('Audience segment saved successfully!');
        setNewAudienceName('');
        loadData();
      }
    } catch (err: any) {
      alert('Error saving segment: ' + err.message);
    }
  };

  const runPreSendValidation = async () => {
    setValidating(true);
    try {
      // Create campaign draft first
      const draftRes: any = await campaignApi.create({
        title: campaignName || 'Unnamed Draft',
        templateType: campaignType,
        tone,
        optimizationGoal: campaignGoal,
        primaryObjective: ctaText,
        subject: subjectLine,
        bodyTemplate: emailBody,
        priority,
      });

      if (draftRes.success && draftRes.data?.id) {
        setSelectedCampaign(draftRes.data);
        const valRes: any = await campaignApi.validate(draftRes.data.id);
        if (valRes.success) {
          setValidationData(valRes.data);
          setWizardStep(4);
        }
      }
    } catch (err: any) {
      alert('Validation failed: ' + err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedCampaign?.id) return;
    setSendingTest(true);
    try {
      const res: any = await campaignApi.sendTest(selectedCampaign.id, testEmailAddress);
      if (res.success) {
        alert(`Test preview sent to: ${testEmailAddress}`);
      }
    } catch (err: any) {
      alert('Failed to send test email: ' + err.message);
    } finally {
      setSendingTest(false);
    }
  };

  const handleQueueCampaignFinal = async () => {
    if (!selectedCampaign?.id) return;
    setLoading(true);
    try {
      const res: any = await campaignApi.queue(selectedCampaign.id, selectedStudentIds);
      if (res.success) {
        alert(`Campaign queued successfully! Enqueued ${res.queuedCount} personal email deliveries.`);
        setActiveSubmenu('campaigns_dashboard');
      }
    } catch (err: any) {
      alert('Error queueing campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Templates & Automation Actions ---

  const handleCreateTemplate = async () => {
    if (!newTemplateName || !newTemplateSubject || !newTemplateBody) {
      alert('Please fill out all fields.');
      return;
    }
    setCreatingTemplate(true);
    try {
      const res: any = await campaignApi.createTemplate({
        name: newTemplateName,
        subject: newTemplateSubject,
        bodyTemplate: newTemplateBody,
      });
      if (res.success) {
        setNewTemplateName('');
        setNewTemplateSubject('');
        setNewTemplateBody('');
        alert('Custom template created successfully!');
        loadData();
      }
    } catch (err: any) {
      alert('Error creating template: ' + err.message);
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleCreateAutomationRule = async () => {
    if (!newRuleName || !newRuleTemplateId) {
      alert('Please choose a rule name and email template.');
      return;
    }
    setCreatingRule(true);
    try {
      const res: any = await campaignApi.createAutomationRule({
        name: newRuleName,
        triggerEvent: newRuleEvent,
        templateId: newRuleTemplateId,
        priority: 'high',
        tone: 'Conversational',
      });
      if (res.success) {
        setNewRuleName('');
        alert('Automation rule active!');
        loadData();
      }
    } catch (err: any) {
      alert('Failed to create rule: ' + err.message);
    } finally {
      setCreatingRule(false);
    }
  };

  // ─── Sub-views Router ──────────────────────────────────────────────────────

  const renderDashboardTab = () => {
    return (
      <div className="space-y-6">
        {/* Performance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-[#6605c7]/30 transition-all">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sent</span>
              <span className="material-symbols-outlined text-[#6605c7] text-[18px]">send</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{overviewStats.sent}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Unique recipient deliveries</p>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-[#6605c7]/30 transition-all">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Rate</span>
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">visibility</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{overviewStats.openRate}%</h3>
            <p className="text-[10px] text-slate-500 mt-1">Estimated open engagement</p>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-[#6605c7]/30 transition-all">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click CTR</span>
              <span className="material-symbols-outlined text-blue-500 text-[18px]">ads_click</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{overviewStats.clickRate}%</h3>
            <p className="text-[10px] text-slate-500 mt-1">Call-To-Action conversions</p>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-[#6605c7]/30 transition-all">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaigns Run</span>
              <span className="material-symbols-outlined text-purple-500 text-[18px]">campaign</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{overviewStats.totalCampaigns}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Active AI campaign models</p>
          </div>
        </div>

        {/* Charts & Graphs mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Engagement Distribution</h4>
            <div className="h-60 flex items-end gap-3 pb-2 pt-4">
              <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full bg-slate-100 rounded-t-lg h-[40%] relative group transition-all hover:bg-[#6605c7]/30">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">40%</div>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400">Newsletter</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full bg-[#6605c7]/80 rounded-t-lg h-[85%] relative group transition-all hover:bg-[#6605c7]">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">85%</div>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400">Scholarships</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full bg-slate-100 rounded-t-lg h-[30%] relative group transition-all hover:bg-[#6605c7]/30">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">30%</div>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400">Onboarding</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full bg-slate-100 rounded-t-lg h-[65%] relative group transition-all hover:bg-[#6605c7]/30">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">65%</div>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400">EMI Reminders</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Performing Subject Lines</h4>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-xs font-bold text-slate-800">🎓 Ramadan Community Scholarship £5,000 Tuition Waiver</p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-semibold">
                  <span>92% Open</span>
                  <span className="text-[#6605c7]">48% Click</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-xs font-bold text-slate-800">⚡ Document Alert: Synchronize your Academic records via DigiLocker</p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-semibold">
                  <span>88% Open</span>
                  <span className="text-[#6605c7]">41% Click</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Campaigns Queue */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Campaigns Log</h4>
            <button onClick={loadData} className="text-xs font-bold text-[#6605c7] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">refresh</span> Reload
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Campaign Details</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {campaigns.slice(0, 5).map(camp => {
                const pct = camp.totalCount > 0 ? Math.round(((camp.sentCount + camp.failedCount) / camp.totalCount) * 100) : 0;
                return (
                  <tr key={camp.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{camp.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{camp.subject}</div>
                    </td>
                    <td className="px-6 py-4 capitalize">{camp.campaignType.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${
                        camp.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        camp.status === 'sending' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-[#6605c7]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 block">{pct}% Sent</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCreateCampaignTab = () => {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Campaign Composer Wizard</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Define core parameters, generate copy, refine filters, validate, and queue.</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(step => (
              <span key={step} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                wizardStep === step ? 'bg-[#6605c7] text-white border-[#6605c7]' : 'bg-white text-slate-400 border-slate-200'
              }`}>
                {step}
              </span>
            ))}
          </div>
        </div>

        {/* Step 1: Configuration */}
        {wizardStep === 1 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Ireland Masters Welcome Update 2026"
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Type</label>
                <select
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs"
                >
                  <option value="Newsletter">Newsletter</option>
                  <option value="Scholarship Update">Scholarship Update</option>
                  <option value="Loan Approval">Loan Approval Welcome</option>
                  <option value="Document Reminder">Missing Documents Reminder</option>
                  <option value="EMI Reminder">EMI Payment Reminder</option>
                  <option value="University Update">University Admission Update</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Tone Style</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs"
                >
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Premium">Premium</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Queue</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target CTA Label</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. Upload Passport"
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Goal (AI Instructions)</label>
              <textarea
                value={campaignGoal}
                onChange={(e) => setCampaignGoal(e.target.value)}
                placeholder="Instruct the AI on what parameters this campaign should target. For example: Remind Ireland bound postgraduate candidates to upload their pending visa documentation to avoid approval delays."
                rows={3}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs"
              />
            </div>

            {/* AI Generator Trigger */}
            <div className="bg-[#6605c7]/5 border border-[#6605c7]/10 p-4 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#6605c7]">auto_awesome</span>
                  AI Content Generator
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Let the AI construct the subject line and responsive email templates.</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={generatingAI}
                className="px-4 py-2 bg-[#6605c7] hover:bg-[#5204a1] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {generatingAI ? 'Composing...' : 'Generate Copy'}
              </button>
            </div>

            <div className="flex flex-col gap-1 pt-3 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Generated Subject Line</label>
              <input
                type="text"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                placeholder="Generated Subject Line"
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Generated Email Body (HTML Template)</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Generate HTML copy or paste your own template..."
                rows={10}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs font-mono"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium">Supports dynamic variables: <code>{"{{studentName}}"}</code>, <code>{"{{country}}"}</code>, <code>{"{{course}}"}</code>, <code>{"{{loanAmount}}"}</code></span>
              <button
                onClick={() => setWizardStep(2)}
                disabled={!subjectLine || !emailBody}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 disabled:opacity-40"
              >
                Continue: Audience selection
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Audience Segment Builder */}
        {wizardStep === 2 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Advanced AND / OR Filter Builder</h4>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter Logic:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterLogic('AND')}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      filterLogic === 'AND' ? 'bg-[#6605c7] text-white border-[#6605c7]' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Match All (AND)
                  </button>
                  <button
                    onClick={() => setFilterLogic('OR')}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      filterLogic === 'OR' ? 'bg-[#6605c7] text-white border-[#6605c7]' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Match Any (OR)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Country</label>
                  <input
                    type="text"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    placeholder="e.g. Ireland"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Target University</label>
                  <input
                    type="text"
                    value={filterUniversity}
                    onChange={(e) => setFilterUniversity(e.target.value)}
                    placeholder="e.g. Dublin"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Intake / Course</label>
                  <input
                    type="text"
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Loan Status</label>
                  <select
                    value={filterLoanStatus}
                    onChange={(e) => setFilterLoanStatus(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">All Loan Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="disbursed">Disbursed</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Admission Status</label>
                  <input
                    type="text"
                    value={filterAdmitStatus}
                    onChange={(e) => setFilterAdmitStatus(e.target.value)}
                    placeholder="e.g. admit_received"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">AI Eligibility Score (Min)</label>
                  <input
                    type="number"
                    value={filterMinScore}
                    onChange={(e) => setFilterMinScore(e.target.value)}
                    placeholder="e.g. 70"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAudienceName}
                    onChange={(e) => setNewAudienceName(e.target.value)}
                    placeholder="Save Segment Name"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-48"
                  />
                  <button
                    onClick={handleSaveSegment}
                    className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-[10px] uppercase hover:bg-slate-800"
                  >
                    Save Segment
                  </button>
                </div>
                <button
                  onClick={handleApplyAudienceFilters}
                  disabled={loadingStudents}
                  className="px-5 py-2 bg-[#6605c7] hover:bg-[#5204a1] text-white font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                >
                  {loadingStudents ? 'Querying...' : 'Preview Target Count'}
                </button>
              </div>
            </div>

            {/* Recipient Count Panel */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <span className="text-[11px] font-bold text-slate-600">Students Selected: {selectedStudentIds.length} / {students.length} matched</span>
              <span className="px-3 py-1 bg-[#6605c7]/10 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[#6605c7]/10">
                Audience Ready
              </span>
            </div>

            {/* Recipients Scroll */}
            <div className="max-h-[250px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {students.map(s => (
                <div key={s.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={(e) => {
                        setSelectedStudentIds(prev =>
                          e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id)
                        );
                      }}
                      className="w-4 h-4 text-[#6605c7] border-slate-300 rounded focus:ring-[#6605c7]"
                    />
                    <div>
                      <div className="font-bold text-slate-800">{s.firstName || 'Student'} {s.lastName || ''}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{s.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#6605c7]">{s.studyDestination || 'Unspecified'}</span>
                    <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-xs">{s.targetUniversity || 'University choice'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button onClick={() => setWizardStep(1)} className="text-xs font-bold text-slate-500 hover:text-slate-700">Back</button>
              <button
                onClick={runPreSendValidation}
                disabled={selectedStudentIds.length === 0 || validating}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1.5"
              >
                {validating ? 'Validating Copy...' : 'Validate and Preview'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {wizardStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1 rounded text-[10px] font-bold border ${previewDevice === 'desktop' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`px-3 py-1 rounded text-[10px] font-bold border ${previewDevice === 'tablet' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                  >
                    Tablet
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1 rounded text-[10px] font-bold border ${previewDevice === 'mobile' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                  >
                    Mobile
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode('html')}
                    className={`px-3 py-1 rounded text-[10px] font-bold border ${previewMode === 'html' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setPreviewMode('text')}
                    className={`px-3 py-1 rounded text-[10px] font-bold border ${previewMode === 'text' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                  >
                    Plain Text
                  </button>
                </div>
              </div>

              {/* Responsive Device Frame Mockup */}
              <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 min-h-[400px] flex justify-center items-start shadow-inner">
                <div className={`bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200/80 transition-all duration-300 ${
                  previewDevice === 'desktop' ? 'w-full max-w-[800px]' : previewDevice === 'tablet' ? 'w-[500px] h-[650px]' : 'w-[320px] h-[550px]'
                }`}>
                  <div className="bg-slate-50 border-b border-slate-100 p-4 text-[10px] text-slate-500 space-y-1">
                    <div><strong>From:</strong> VidyaLoan Notifications &lt;noreply@vidyaloan.com&gt;</div>
                    <div><strong>Subject:</strong> {subjectLine.replace('{{studentName}}', 'Jane Doe')}</div>
                  </div>
                  {previewMode === 'html' ? (
                    <div
                      className="p-5 overflow-y-auto h-[350px] custom-scrollbar"
                      dangerouslySetInnerHTML={{
                        __html: emailBody
                          .replace('{{studentName}}', 'Jane Doe')
                          .replace('{{country}}', 'Ireland')
                          .replace('{{course}}', 'MSc Data Analytics')
                          .replace('{{loanAmount}}', '₹15,00,000')
                      }}
                    />
                  ) : (
                    <textarea
                      readOnly
                      value={emailBody.replace(/<[^>]*>/g, '').trim()}
                      className="w-full h-[350px] p-5 font-mono text-[11px] text-slate-600 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right panel summary metrics */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Campaign Send Summary</h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-slate-400">Total Recipients</span>
                  <span className="font-bold text-slate-800">{selectedStudentIds.length} Students</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-slate-400">Priority Level</span>
                  <span className="font-bold text-slate-800 uppercase">{priority}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-slate-400">Estimated CTR</span>
                  <span className="font-bold text-emerald-600">45% Open / 18% CTR</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-slate-400">Spam Deliverability</span>
                  <span className="font-bold text-emerald-500">Low Spam Risk (1.2)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="Admin email"
                    className="px-3 py-2 border border-slate-200 rounded-lg text-xs w-full"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    disabled={sendingTest}
                    className="px-3 py-2 bg-slate-900 text-white font-bold rounded-lg text-[10px] uppercase whitespace-nowrap hover:bg-slate-800"
                  >
                    {sendingTest ? 'Sending...' : 'Send Test'}
                  </button>
                </div>

                <button
                  onClick={handleQueueCampaignFinal}
                  className="w-full py-3 bg-[#6605c7] hover:bg-[#5204a1] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span> Confirm & Queue Campaign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: AI Validation Checklist */}
        {wizardStep === 4 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">AI Pre-send Validator Checklist</h4>
            {validationData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-400">Subject Score</p>
                    <p className="text-xl font-bold mt-1 text-emerald-600">{validationData.scores.subjectScore} / 100</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-400">CTA Engagement Score</p>
                    <p className="text-xl font-bold mt-1 text-emerald-600">{validationData.scores.ctaScore} / 100</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-400">AI Spam Risk Score</p>
                    <p className="text-xl font-bold mt-1 text-[#6605c7]">{validationData.scores.spamScore} / 10</p>
                  </div>
                </div>

                {validationData.warnings.length > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
                    <h5 className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">warning</span> Warnings & Adjustments Recommended
                    </h5>
                    <ul className="list-disc pl-5 text-[11px] text-amber-600 space-y-1">
                      {validationData.warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                    <button
                      onClick={handleGenerateAI}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase mt-2 hover:bg-amber-700"
                    >
                      🛠️ Fix & Refine with AI
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-700 flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined">check_circle</span>
                    All validation checks passed! Email matches mobile responsiveness and spam-safe guidelines.
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800"
                  >
                    Proceed to Preview & Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTemplatesTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates library */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Campaign Templates</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 hover:border-[#6605c7]/30 transition-all flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-slate-800">{t.name}</h5>
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-100 rounded text-[9px] font-semibold text-slate-500 uppercase inline-block mt-1">{t.type}</span>
                  <p className="text-[11px] text-slate-400 truncate mt-2 font-mono">{t.subject}</p>
                </div>
                <button
                  onClick={() => {
                    setSubjectLine(t.subject);
                    setEmailBody(t.bodyTemplate);
                    setCampaignType(t.type);
                    setCampaignName(t.name);
                    setActiveSubmenu('campaigns_create');
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-[10px] font-bold uppercase text-slate-700 text-center"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Create new template form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Create Custom Template</h4>
          <div className="space-y-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template Name</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template Name"
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Line</label>
              <input
                type="text"
                value={newTemplateSubject}
                onChange={(e) => setNewTemplateSubject(e.target.value)}
                placeholder="Subject Line"
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Body content HTML</label>
              <textarea
                value={newTemplateBody}
                onChange={(e) => setNewTemplateBody(e.target.value)}
                placeholder="HTML structure template"
                rows={8}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <button
              onClick={handleCreateTemplate}
              disabled={creatingTemplate}
              className="w-full py-2.5 bg-[#6605c7] hover:bg-[#5204a1] text-white font-bold rounded-lg text-[10px] uppercase"
            >
              {creatingTemplate ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAudienceTab = () => {
    return (
      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved Target Audiences & Segments</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedAudiences.map(aud => (
            <div key={aud.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#6605c7]/30 transition-all space-y-3">
              <div>
                <h5 className="font-bold text-slate-800">{aud.name}</h5>
                <p className="text-[10px] text-slate-500 mt-1">{aud.description}</p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[9px] text-slate-400">Created: {format(new Date(aud.createdAt), 'MMM d, yyyy')}</span>
                <button
                  onClick={() => {
                    const filters = aud.filters || {};
                    setFilterCountry(filters.studyDestination || '');
                    setFilterUniversity(filters.targetUniversity || '');
                    setFilterCourse(filters.courseName || '');
                    setFilterLoanStatus(filters.loanStatus || '');
                    setFilterAdmitStatus(filters.admitStatus || '');
                    setFilterMinScore(filters.minEligibilityScore || '');
                    setActiveSubmenu('campaigns_create');
                    setWizardStep(2);
                  }}
                  className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 text-[10px] font-bold text-slate-700"
                >
                  Load segment
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderScheduledCampaignsTab = () => {
    return (
      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Campaign Schedules</h4>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3">Scheduled At</th>
                <th className="px-6 py-3">Recipients Count</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {campaigns.filter(c => c.status === 'scheduled').map(camp => (
                <tr key={camp.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{camp.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{camp.subject}</div>
                  </td>
                  <td className="px-6 py-4">{format(new Date(camp.scheduledAt), 'MMM d, yyyy · HH:mm')}</td>
                  <td className="px-6 py-4">{camp.totalCount} Students</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={async () => {
                        await campaignApi.cancel(camp.id);
                        loadData();
                      }}
                      className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded border border-rose-100 font-bold hover:bg-rose-100 text-[10px]"
                    >
                      Cancel Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderQueuedCampaignsTab = () => {
    return (
      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">BullMQ Active & Queued Pipelines</h4>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Active Pipeline</th>
                <th className="px-6 py-3">SMTP Queue Status</th>
                <th className="px-6 py-3">Batch Delivery Rate</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {campaigns.filter(c => c.status === 'queued' || c.status === 'sending').map(camp => {
                const total = camp.totalCount || 1;
                const progressPct = Math.round(((camp.sentCount + camp.failedCount) / total) * 100);
                return (
                  <tr key={camp.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{camp.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Subject: {camp.subject}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-600 capitalize">
                      {camp.status} ({camp.sentCount} / {camp.totalCount} sent)
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-[#6605c7] animate-pulse" style={{ width: `${progressPct}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold">{progressPct}% Dispatch Rate</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          await campaignApi.cancel(camp.id);
                          loadData();
                        }}
                        className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded border border-rose-100 font-bold hover:bg-rose-100 text-[10px]"
                      >
                        Cancel Dispatch
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSentCampaignsTab = () => {
    return (
      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Sent Campaigns</h4>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Campaign Title</th>
                <th className="px-6 py-3">Total Sent</th>
                <th className="px-6 py-3">Open / Click Rate</th>
                <th className="px-6 py-3">Delivery Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {campaigns.filter(c => c.status === 'completed' || c.status === 'sent').map(camp => {
                const total = camp.totalCount || 1;
                const openPct = Math.round(((camp.openCount || 0) / total) * 100);
                const clickPct = Math.round(((camp.clickCount || 0) / total) * 100);
                return (
                  <tr key={camp.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{camp.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Subject: {camp.subject}</div>
                    </td>
                    <td className="px-6 py-4 font-bold">{camp.totalCount} Recipient(s)</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-600">{openPct}% Open</span>
                      <span className="text-slate-400 mx-1.5">/</span>
                      <span className="font-semibold text-[#6605c7]">{clickPct}% CTR</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{format(new Date(camp.updatedAt || camp.createdAt), 'MMM d, yyyy · HH:mm')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    return (
      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Campaign Conversions</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h5 className="text-xs font-bold text-slate-700">Open Timeline Breakdown</h5>
            {/* Visual graph details mockup */}
            <div className="h-48 flex items-end gap-2.5 pt-4">
              <div className="flex-1 bg-[#6605c7]/80 rounded-t-sm h-[30%]" />
              <div className="flex-1 bg-[#6605c7]/80 rounded-t-sm h-[45%]" />
              <div className="flex-1 bg-[#6605c7]/80 rounded-t-sm h-[70%]" />
              <div className="flex-1 bg-[#6605c7]/80 rounded-t-sm h-[90%]" />
              <div className="flex-1 bg-[#6605c7]/80 rounded-t-sm h-[60%]" />
              <div className="flex-1 bg-[#6605c7]/80 rounded-t-sm h-[40%]" />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>9 AM</span>
              <span>12 PM</span>
              <span>3 PM</span>
              <span>6 PM</span>
              <span>9 PM</span>
              <span>12 AM</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h5 className="text-xs font-bold text-slate-700">Recipient Device Distributions</h5>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1">
                  <span>Mobile Clients</span>
                  <span>72%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '72%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1">
                  <span>Desktop Mailer Clients</span>
                  <span>24%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: '24%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1">
                  <span>Tablet Clients</span>
                  <span>4%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '4%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAutomationTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active automation triggers */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Automation Rules</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {automationRules.map(rule => (
              <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#6605c7]/30 transition-all space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-800">{rule.name}</h5>
                    <span className="px-2 py-0.5 bg-[#6605c7]/10 text-[#6605c7] text-[9px] font-bold tracking-wider rounded inline-block mt-1">
                      Event: {rule.triggerEvent}
                    </span>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <div className="pt-2.5 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>Priority: {rule.priority.toUpperCase()}</span>
                  <span>Tone: {rule.tone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create automation trigger form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Create Automation Trigger Rule</h4>
          <div className="space-y-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule Name</label>
              <input
                type="text"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="e.g. Loan Disbursed Congratulations"
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger Event</label>
              <select
                value={newRuleEvent}
                onChange={(e) => setNewRuleEvent(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs"
              >
                <option value="Application Submitted">Application Submitted</option>
                <option value="Loan Approved">Loan Approved</option>
                <option value="Missing Passport">Missing Passport Upload</option>
                <option value="Offer Letter Uploaded">Offer Letter Uploaded</option>
                <option value="Visa Approved">Visa Approved</option>
                <option value="EMI Due">EMI Due Date</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Template</label>
              <select
                value={newRuleTemplateId}
                onChange={(e) => setNewRuleTemplateId(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6605c7] text-xs"
              >
                <option value="">Choose Campaign Template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateAutomationRule}
              disabled={creatingRule}
              className="w-full py-2.5 bg-[#6605c7] hover:bg-[#5204a1] text-white font-bold rounded-lg text-[10px] uppercase"
            >
              {creatingRule ? 'Creating...' : 'Activate Trigger Rule'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPromptHistoryTab = () => {
    return (
      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">OpenRouter AI Generated Prompt History</h4>
        <div className="space-y-3.5 max-w-4xl mx-auto">
          {promptHistory.map(history => (
            <div key={history.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-xs">Campaign: {history.campaign?.name || 'Automation Trigger'}</span>
                <span className="px-2.5 py-1 bg-[#6605c7]/5 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[#6605c7]/10">
                  Confidence: {history.confidenceScore}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-mono text-slate-600 max-h-32 overflow-y-auto">
                <strong>AI Personalization Result:</strong><br />
                Subject: {history.subject}<br />
                Preview: {history.previewText}<br />
                CTA: {history.cta}
              </div>
              <span className="text-[9px] text-slate-400 block font-bold">{format(new Date(history.createdAt), 'MMM d, yyyy · HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">AI Campaign Global Settings</h4>
        <div className="space-y-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Throttle Limit</label>
            <input
              type="text"
              defaultValue="10 emails / 30 seconds"
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fallback SMTP Sender Address</label>
            <input
              type="email"
              defaultValue="harikikeerthi@gmail.com"
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Copywriting Model Primary</label>
            <input
              type="text"
              defaultValue="openai/gpt-4o-mini"
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fallback SMTP Signature (HTML)</label>
            <textarea
              defaultValue="<p style='color: #64748b; font-size: 11px;'>VidyaLoan Technologies, Bengaluru, India</p>"
              rows={3}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
          <button
            onClick={() => alert('Global settings saved successfully!')}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-[10px] uppercase hover:bg-slate-800"
          >
            Save Global Configuration
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight capitalize">
            {activeSubmenu.replace('campaigns_', ' ').replace('prompts', 'prompt history')}
          </h2>
          <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Configure target audience marketing, announcements, and track progress.</p>
        </div>
      </div>

      {/* Main Tab Render Routing */}
      {activeSubmenu === 'campaigns_dashboard' && renderDashboardTab()}
      {activeSubmenu === 'campaigns_create' && renderCreateCampaignTab()}
      {activeSubmenu === 'campaigns_templates' && renderTemplatesTab()}
      {activeSubmenu === 'campaigns_audience' && renderAudienceTab()}
      {activeSubmenu === 'campaigns_scheduled' && renderScheduledCampaignsTab()}
      {activeSubmenu === 'campaigns_queued' && renderQueuedCampaignsTab()}
      {activeSubmenu === 'campaigns_sent' && renderSentCampaignsTab()}
      {activeSubmenu === 'campaigns_analytics' && renderAnalyticsTab()}
      {activeSubmenu === 'campaigns_prompts' && renderPromptHistoryTab()}
      {activeSubmenu === 'campaigns_settings' && renderSettingsTab()}
    </div>
  );
}
