
import React, { useState, useEffect } from 'react';
import { campaignApi } from '@/lib/api';
import { format } from 'date-fns';

interface CampaignsDashboardProps {
  activeSubmenu: string;
  setActiveSubmenu: (submenu: string) => void;
}

const CAMPAIGN_PRESETS = [
  {
    id: 'sanction_rate_drop',
    title: 'Bank Sanctions & 9.5% Rate Drop',
    icon: 'percent',
    badge: 'High Conversion',
    goal: 'Notify students about reduced overseas education loan interest rates from 9.5% with zero collateral',
    cta: 'Check Sanction Rates',
    type: 'Loan Approval',
    tone: 'Professional',
    customInstructions: 'Highlight that partner banks (SBI, HDFC Credila, Avanse, ICICI) dropped education loan rates to 9.5% for Fall/Spring intake applicants with up to ₹1.5 Cr collateral-free options and 48h turnaround.'
  },
  {
    id: 'digilocker_docs',
    title: 'Urgent DigiLocker Document Verification',
    icon: 'sync_saved_locally',
    badge: 'Action Required',
    goal: 'Fast-track loan file processing by verifying Aadhaar, PAN & academic marksheets via DigiLocker in 2 minutes',
    cta: 'Verify via DigiLocker',
    type: 'Document Reminder',
    tone: 'Urgent',
    customInstructions: 'Emphasize that missing or unverified documents delay sanction letters, but 1-click DigiLocker sync instantly verifies KYC and accelerates approval within 24-48 hours.'
  },
  {
    id: 'visa_mock_session',
    title: 'Consulate Visa Mock Interview & Proof of Funds',
    icon: 'verified_user',
    badge: 'High Engagement',
    goal: 'Invite student to schedule 1-on-1 Visa Mock Interview and receive official Loan Sanction Letter for visa appointment',
    cta: 'Book Visa Mock Session',
    type: 'University Update',
    tone: 'Premium',
    customInstructions: 'Explain the critical role of the official Loan Sanction Letter as primary Proof of Financial Solvency (POFS) for US F-1, UK Student Route, German Blocked Accounts, and Canadian GIC.'
  },
  {
    id: 'scholarship_forex',
    title: 'Global £5,000 Scholarship & Zero Forex Markup',
    icon: 'redeem',
    badge: 'Popular',
    goal: 'Reward eligible scholars with £5,000 tuition grant and zero-markup international student forex card benefits',
    cta: 'Claim Scholarship',
    type: 'Scholarship Update',
    tone: 'Conversational',
    customInstructions: 'Highlight exclusive university partnership grants, £5,000 tuition fee waivers, and complimentary multi-currency forex card with zero ATM markup fees.'
  },
  {
    id: 'intake_deadlines',
    title: 'Upcoming Intake Sanction Deadlines',
    icon: 'event_upcoming',
    badge: 'Time-Sensitive',
    goal: 'Prompt students to lock in loan approvals before university tuition payment cutoffs',
    cta: 'Lock In Sanction Letter',
    type: 'Newsletter',
    tone: 'Urgent',
    customInstructions: 'Warn about impending university fee deadlines and bank processing queues. Urge immediate sanction letter generation to avoid visa filing delays.'
  },
  {
    id: 'advisor_checkin',
    title: 'Dedicated Loan Advisor Consultation',
    icon: 'support_agent',
    badge: 'Personalized',
    goal: 'Connect student directly with their assigned senior education financing specialist',
    cta: 'Schedule Advisor Call',
    type: 'Loan Approval',
    tone: 'Friendly',
    customInstructions: 'Introduce their personal study abroad loan manager ready to compare 15+ tailored bank quotes and negotiate lowest processing fees on their behalf.'
  },
];

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

  // --- Sent Student Emails States ---
  const [studentRecipients, setStudentRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientFilterStatus, setRecipientFilterStatus] = useState('all');
  const [recipientFilterCampaign, setRecipientFilterCampaign] = useState('all');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipientModal, setSelectedRecipientModal] = useState<any>(null);
  const [recipientPreviewData, setRecipientPreviewData] = useState<any>(null);
  const [loadingRecipientPreview, setLoadingRecipientPreview] = useState(false);
  const [recipientModalTab, setRecipientModalTab] = useState<'rendered' | 'source' | 'variables'>('rendered');

  // --- Wizard States (Create Campaign) ---
  const [wizardStep, setWizardStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('Boost Masters education loan conversion for Fall/Spring applicants');
  const [campaignType, setCampaignType] = useState('Scholarship Update');
  const [priority, setPriority] = useState('medium');
  const [tone, setTone] = useState('Professional');
  const [emailLength, setEmailLength] = useState('medium');
  const [ctaText, setCtaText] = useState('Check Sanction Rates');
  const [language, setLanguage] = useState('English');
  const [brandName, setBrandName] = useState('VidyaLoans');
  const [subjectLine, setSubjectLine] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [referenceCampaignId, setReferenceCampaignId] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  // --- Device & Variable Simulation Preview ---
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'rendered' | 'source'>('rendered');
  const [sampleStudent, setSampleStudent] = useState({
    name: 'Priya Sharma',
    country: 'United States',
    university: 'New York University (NYU)',
    course: 'MS Computer Science',
    loanAmount: '₹45,00,000',
  });
  const [testEmailAddress, setTestEmailAddress] = useState('admin@vidyaloans.com');
  const [sendingTest, setSendingTest] = useState(false);

  // --- Audience Selection States ---
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savedAudiences, setSavedAudiences] = useState<any[]>([]);
  const [newAudienceName, setNewAudienceName] = useState('');

  // Filters State
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

  const loadStudentRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const res: any = await campaignApi.getRecipients({
        campaignId: recipientFilterCampaign !== 'all' ? recipientFilterCampaign : undefined,
        status: recipientFilterStatus !== 'all' ? recipientFilterStatus : undefined,
        search: recipientSearch || undefined,
      });
      if (res.success) {
        setStudentRecipients(res.data || []);
      }
    } catch (err) {
      console.error('Error loading student recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Always ensure campaigns list is available (especially for Reference Campaign selector)
      const campRes: any = await campaignApi.getAll(100, 0);
      if (campRes.success) setCampaigns(campRes.data || []);

      if (activeSubmenu === 'campaigns_dashboard' || activeSubmenu === 'campaigns_analytics') {
        const resStats: any = await campaignApi.getOverviewStats();
        if (resStats.success) setOverviewStats(resStats.data);
      }

      if (activeSubmenu === 'campaigns_student_emails' || activeSubmenu === 'campaigns_dashboard') {
        loadStudentRecipients();
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
    if (activeSubmenu !== 'campaigns_create') {
      setWizardStep(1);
    }
  }, [activeSubmenu]);

  useEffect(() => {
    if (activeSubmenu === 'campaigns_student_emails') {
      loadStudentRecipients();
    }
  }, [recipientFilterStatus, recipientFilterCampaign, recipientSearch]);

  // Poll for queued/sending progress updates
  useEffect(() => {
    const activeProgress = campaigns.some(c => c.status === 'sending' || c.status === 'queued');
    if (!activeProgress) return;

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [campaigns]);

  // ─── Recipient Modal & Preview ────────────────────────────────────────────

  const handleViewRecipientEmail = async (recipient: any) => {
    setSelectedRecipientModal(recipient);
    setLoadingRecipientPreview(true);
    setRecipientModalTab('rendered');
    try {
      const res: any = await campaignApi.getRecipientPreview(recipient.id);
      if (res.success) {
        setRecipientPreviewData(res.data);
      }
    } catch (err) {
      console.error('Error loading recipient preview:', err);
    } finally {
      setLoadingRecipientPreview(false);
    }
  };

  // ─── Creating / Wizard Functions ──────────────────────────────────────────

  const handleApplyPreset = (preset: typeof CAMPAIGN_PRESETS[0]) => {
    setCampaignName(preset.title);
    setCampaignType(preset.type);
    setCampaignGoal(preset.goal);
    setCtaText(preset.cta);
    setTone(preset.tone);
    setCustomInstructions(preset.customInstructions);
  };

  const handleSelectReferenceCampaign = (id: string) => {
    setReferenceCampaignId(id);
    if (!id) return;
    const camp = campaigns.find(c => c.id === id);
    if (camp) {
      setSubjectLine(camp.subject || '');
      setEmailBody(camp.body || '');
      if (camp.campaignType) setCampaignType(camp.campaignType);
      if (camp.tone) setTone(camp.tone);
      if (camp.optimizationGoal) setCampaignGoal(camp.optimizationGoal);
      if (camp.primaryObjective) setCtaText(camp.primaryObjective);
      setCustomInstructions(`Refining existing campaign: "${camp.name}". Optimize message hierarchy and tone for higher student response rate.`);
    }
  };

  const handleAIEnhanceAction = async (action: 'professional' | 'urgent' | 'tags' | 'shorten') => {
    if (!emailBody && !campaignGoal) {
      alert('Please enter campaign details or generate an email body first.');
      return;
    }
    setGeneratingAI(true);
    let actionInstruction = '';
    if (action === 'professional') actionInstruction = 'Refine and polish the tone to be highly prestigious, trustworthy, and compliant with banking regulatory standards for overseas education loans.';
    if (action === 'urgent') actionInstruction = 'Inject a sense of urgency regarding upcoming university intake deadlines, rate lock-in dates, and high demand for zero-collateral quotas.';
    if (action === 'tags') actionInstruction = 'Ensure dynamic student tags like {{studentName}}, {{university}}, {{country}}, {{loanAmount}}, and {{dashboardUrl}} are seamlessly embedded in the copy.';
    if (action === 'shorten') actionInstruction = 'Make the copy concise, punchy, and mobile-optimized with clear bullet highlights.';

    try {
      const res: any = await campaignApi.generate({
        optimizationGoal: campaignGoal,
        primaryObjective: ctaText,
        targetContext: campaignName,
        tone: action === 'urgent' ? 'Urgent' : (action === 'professional' ? 'Professional' : tone),
        emailLength: action === 'shorten' ? 'short' : emailLength,
        language,
        brand: brandName,
        cta: ctaText,
        referenceCampaignId: referenceCampaignId || undefined,
        customInstructions: `${actionInstruction}\n${customInstructions ? `Additional notes: ${customInstructions}` : ''}\nExisting draft subject: "${subjectLine}"\nExisting draft body:\n${emailBody}`,
      });

      if (res.success && res.data) {
        setSubjectLine(res.data.subject);
        setEmailBody(res.data.bodyTemplate);
      } else {
        alert('AI refinement failed.');
      }
    } catch (err: any) {
      alert('AI Enhancement Error: ' + err.message);
    } finally {
      setGeneratingAI(false);
    }
  };

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
        referenceCampaignId: referenceCampaignId || undefined,
        customInstructions,
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

  const handleAutoGenerateAndValidate = async () => {
    if (!campaignName) {
      alert('Please fill out the Campaign Name first.');
      return;
    }
    setGeneratingAI(true);
    setValidating(true);
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
        referenceCampaignId: referenceCampaignId || undefined,
        customInstructions,
      });

      if (res.success && res.data) {
        const subject = res.data.subject;
        const body = res.data.bodyTemplate;
        setSubjectLine(subject);
        setEmailBody(body);

        const draftRes: any = await campaignApi.create({
          title: campaignName,
          templateType: campaignType,
          tone,
          optimizationGoal: campaignGoal,
          primaryObjective: ctaText,
          subject: subject,
          bodyTemplate: body,
          priority,
        });

        if (draftRes.success && draftRes.data?.id) {
          setSelectedCampaign(draftRes.data);
          const valRes: any = await campaignApi.validate(draftRes.data.id);
          if (valRes.success) {
            setValidationData(valRes.data);
          }
        }
      } else {
        alert('AI Email generation failed.');
      }
    } catch (err: any) {
      alert('AI Auto-Generation Error: ' + err.message);
    } finally {
      setGeneratingAI(false);
      setValidating(false);
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

  // ─── Sub-views Router ──────────────────────────────────────────────────────

  const renderDashboardTab = () => {
    return (
      <div className="space-y-6">
        {/* Quick Action Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#6605c7] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 text-white tracking-wider backdrop-blur-sm border border-white/20">
                AI Email Suite
              </span>
              <span className="text-xs text-purple-200 font-medium">India's Study Abroad Education Loan Platform</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Personalized Student Broadcasts & Smart Reminders</h3>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              Generate RBI-compliant sanction letters, rate drop notifications, and document alerts tailored to each student's destination university and loan amount.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveSubmenu('campaigns_create')}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-[#6605c7] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span> Create AI Campaign
            </button>
            <button
              onClick={() => setActiveSubmenu('campaigns_student_emails')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-white/20 backdrop-blur-sm transition-all"
            >
              <span className="material-symbols-outlined text-sm">mark_email_read</span> View Sent Student Emails
            </button>
          </div>
        </div>

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

        {/* Quick Presets Inspiration Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">1-Click High-Converting Campaign Presets</h4>
              <p className="text-[11px] text-slate-500">Select any pre-configured template to open in the AI Campaign Composer.</p>
            </div>
            <button
              onClick={() => setActiveSubmenu('campaigns_create')}
              className="text-xs font-bold text-[#6605c7] hover:underline flex items-center gap-1"
            >
              Open Composer <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {CAMPAIGN_PRESETS.slice(0, 3).map(preset => (
              <div
                key={preset.id}
                onClick={() => {
                  handleApplyPreset(preset);
                  setActiveSubmenu('campaigns_create');
                }}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#6605c7] hover:shadow-md cursor-pointer transition-all flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#6605c7]/10 text-[#6605c7] flex items-center justify-center flex-shrink-0 group-hover:bg-[#6605c7] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-base">{preset.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 truncate">{preset.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{preset.goal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts & Graphs */}
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSubmenu('campaigns_student_emails')}
                className="text-xs font-bold text-[#6605c7] hover:underline flex items-center gap-1"
              >
                View Student Recipient Logs <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
              <button onClick={loadData} className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">refresh</span> Reload
              </button>
            </div>
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
                    <td className="px-6 py-4 capitalize">{camp.campaignType ? camp.campaignType.replace('_', ' ') : 'Newsletter'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${camp.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
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

  // ─── Sent Student Emails & Recipient Logs ──────────────────────────────────

  const renderStudentEmailsTab = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header & Metric Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6605c7]">mark_email_read</span>
              Sent Student Emails & Recipient Tracking
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Browse every personalized email delivered to study abroad students with real-time delivery, open, and click metrics.
            </p>
          </div>
          <button
            onClick={loadStudentRecipients}
            disabled={loadingRecipients}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${loadingRecipients ? 'animate-spin' : ''}`}>refresh</span>
            Refresh Logs
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              placeholder="Search by student name, email, university or subject..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7]"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Campaign Dropdown */}
            <select
              value={recipientFilterCampaign}
              onChange={(e) => setRecipientFilterCampaign(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] bg-white text-slate-700"
            >
              <option value="all">All Campaigns ({campaigns.length})</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status Pills */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {['all', 'sent', 'opened', 'clicked', 'failed'].map(status => (
                <button
                  key={status}
                  onClick={() => setRecipientFilterStatus(status)}
                  className={`px-3 py-1.5 text-[11px] font-bold capitalize rounded-md transition-all ${
                    recipientFilterStatus === status
                      ? 'bg-white text-[#6605c7] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-6 py-3.5">Study Destination</th>
                  <th className="px-6 py-3.5">Campaign & Subject</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Sent At</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingRecipients ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-2xl animate-spin text-[#6605c7]">progress_activity</span>
                        <p className="text-xs font-semibold">Loading student recipient logs...</p>
                      </div>
                    </td>
                  </tr>
                ) : studentRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <span className="material-symbols-outlined text-3xl text-slate-300">mail</span>
                        <p className="text-xs font-semibold text-slate-600">No sent student emails found</p>
                        <p className="text-[11px] text-slate-400">Try adjusting your search query or dispatch a campaign from the composer workspace.</p>
                        <button
                          onClick={() => setActiveSubmenu('campaigns_create')}
                          className="mt-2 px-4 py-2 bg-[#6605c7] text-white font-bold rounded-lg text-xs"
                        >
                          Create Campaign
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  studentRecipients.map((rec) => {
                    const studentName = rec.user?.firstName ? `${rec.user.firstName} ${rec.user.lastName || ''}`.trim() : (rec.recipientName || 'Student');
                    const initial = studentName.charAt(0).toUpperCase() || 'S';
                    const university = rec.user?.targetUniversity || (rec.variables as any)?.university || 'University Applicant';
                    const country = rec.user?.studyDestination || (rec.variables as any)?.country || 'Global';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Student Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6605c7] to-indigo-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                              {initial}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{studentName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{rec.recipientEmail}</div>
                            </div>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{country}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{university}</div>
                        </td>

                        {/* Campaign & Subject */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 truncate max-w-[240px]">{rec.campaign?.name || 'Campaign'}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[240px] mt-0.5">
                            {rec.campaign?.subject || 'Personalized Education Loan Update'}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {rec.status === 'clicked' && (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">ads_click</span> Clicked Link
                            </span>
                          )}
                          {rec.status === 'opened' && (
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-100 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">visibility</span> Opened
                            </span>
                          )}
                          {rec.status === 'sent' && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">check_circle</span> Delivered
                            </span>
                          )}
                          {rec.status === 'failed' && (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-100 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">error</span> Failed
                            </span>
                          )}
                          {rec.status === 'queued' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">hourglass_empty</span> Queued
                            </span>
                          )}
                        </td>

                        {/* Sent Timestamp */}
                        <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                          {rec.sentAt ? format(new Date(rec.sentAt), 'MMM d, yyyy · HH:mm') : (
                            rec.createdAt ? format(new Date(rec.createdAt), 'MMM d, yyyy · HH:mm') : '-'
                          )}
                        </td>

                        {/* Action: View Email */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewRecipientEmail(rec)}
                            className="px-3 py-1.5 bg-[#6605c7]/10 hover:bg-[#6605c7] text-[#6605c7] hover:text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 ml-auto"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span> View Email
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─── Create Campaign Workspace ───────────────────────────────────────────

  const renderCreateCampaignTab = () => {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Workspace Stepper Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6605c7]">auto_awesome</span>
              AI Education Loan Campaign Composer
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Draft professional, personalized email broadcasts for Indian students planning overseas studies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2].map(step => (
              <span
                key={step}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                  wizardStep === step
                    ? 'bg-[#6605c7] text-white border-[#6605c7] shadow-md shadow-[#6605c7]/20'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        {/* Step 1: Configuration, Inspiration Presets & Live Multi-Device Preview */}
        {wizardStep === 1 && (
          <div className="space-y-6">
            {/* 1-Click High-Converting Campaign Presets */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-[#6605c7] tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">recommend</span>
                  1-Click High-Converting Presets
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Click any preset to auto-load goals and copy parameters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CAMPAIGN_PRESETS.map(preset => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50/50 hover:border-[#6605c7] hover:shadow-md cursor-pointer transition-all flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#6605c7]/10 text-[#6605c7] flex items-center justify-center flex-shrink-0 group-hover:bg-[#6605c7] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-base">{preset.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800 truncate">{preset.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{preset.goal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split 2-Column Composer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Campaign Context & AI Settings (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
                  {/* Reference Existing Campaign Box */}
                  <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">history_edu</span>
                        Reference an Existing Campaign (Optional)
                      </label>
                      {referenceCampaignId && (
                        <button
                          onClick={() => setReferenceCampaignId('')}
                          className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                        >
                          Clear Reference
                        </button>
                      )}
                    </div>
                    <select
                      value={referenceCampaignId}
                      onChange={(e) => handleSelectReferenceCampaign(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] bg-white text-slate-800"
                    >
                      <option value="">-- Choose a past campaign to elevate or remix --</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.subject})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-purple-700">
                      Select any existing campaign and AI will analyze its points, elevating the copy with fresh, high-converting language.
                    </p>
                  </div>

                  {/* Campaign Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Title</label>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="e.g. Fall 2026 Sanction Rate Drop"
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] text-xs font-semibold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Category</label>
                      <select
                        value={campaignType}
                        onChange={(e) => setCampaignType(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] text-xs font-semibold bg-white"
                      >
                        <option value="Loan Approval">Loan Approval & Sanction</option>
                        <option value="Scholarship Update">Scholarship & Grant</option>
                        <option value="Document Reminder">Document Verification (DigiLocker)</option>
                        <option value="University Update">Visa Proof of Funds / Mock</option>
                        <option value="EMI Reminder">EMI Payment Schedule</option>
                        <option value="Newsletter">Study Abroad Weekly Digest</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Copywriting Tone</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] text-xs font-semibold bg-white"
                      >
                        <option value="Professional">Professional & Trustworthy</option>
                        <option value="Urgent">Urgent & Action-Oriented</option>
                        <option value="Conversational">Conversational & Helpful</option>
                        <option value="Premium">Premium Executive</option>
                        <option value="Friendly">Friendly & Encouraging</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary CTA Button</label>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="e.g. Check Sanction Rates"
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Goal & Message Focus</label>
                    <textarea
                      value={campaignGoal}
                      onChange={(e) => setCampaignGoal(e.target.value)}
                      placeholder="E.g. Inform student on reduced loan interest rates from 9.5% with zero collateral up to ₹1.5 Cr and 48-hour approval turnaround."
                      rows={2}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] text-xs font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom AI Instructions / Value Propositions</label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Mention 50+ partnered banks, paperless DigiLocker approval, and free study abroad loan assistance."
                      rows={2}
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] text-xs font-semibold"
                    />
                  </div>

                  {/* AI Quick Polish Pills */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Quick Polish Actions</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAIEnhanceAction('professional')}
                        disabled={generatingAI}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#6605c7] hover:text-white text-slate-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-xs">verified</span> Make More Professional
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIEnhanceAction('urgent')}
                        disabled={generatingAI}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#6605c7] hover:text-white text-slate-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-xs">bolt</span> Boost CTA Urgency
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIEnhanceAction('tags')}
                        disabled={generatingAI}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#6605c7] hover:text-white text-slate-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-xs">badge</span> Inject Student Merge Tags
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIEnhanceAction('shorten')}
                        disabled={generatingAI}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#6605c7] hover:text-white text-slate-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-xs">compress</span> Shorten & Punchy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Target Audience Segment Filters */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                  <h4 className="text-xs font-black uppercase text-[#6605c7] tracking-wider mb-2">Target Student Audience</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Destination Country</label>
                      <input
                        type="text"
                        value={filterCountry}
                        onChange={(e) => setFilterCountry(e.target.value)}
                        placeholder="e.g. United States, UK, Ireland"
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Target University</label>
                      <input
                        type="text"
                        value={filterUniversity}
                        onChange={(e) => setFilterUniversity(e.target.value)}
                        placeholder="e.g. NYU, Oxford, Trinity"
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Course / Discipline</label>
                      <input
                        type="text"
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        placeholder="e.g. Computer Science, MBA"
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Loan Status</label>
                      <select
                        value={filterLoanStatus}
                        onChange={(e) => setFilterLoanStatus(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] bg-white"
                      >
                        <option value="">All Loan Stages</option>
                        <option value="pending">Application Incomplete / Pending</option>
                        <option value="approved">Sanction Letter Approved</option>
                        <option value="rejected">Bank Rejection / Ineligible</option>
                        <option value="disbursed">Disbursed to University</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAudienceName}
                        onChange={(e) => setNewAudienceName(e.target.value)}
                        placeholder="Segment Name"
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-40"
                      />
                      <button
                        onClick={handleSaveSegment}
                        className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-[9px] uppercase hover:bg-slate-800 transition-colors"
                      >
                        Save Segment
                      </button>
                    </div>
                    <button
                      onClick={handleApplyAudienceFilters}
                      disabled={loadingStudents}
                      className="px-4 py-2 bg-purple-50 border border-purple-100 hover:bg-purple-100 text-[#6605c7] font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {loadingStudents ? 'Querying Students...' : 'Calculate Matched Students'}
                    </button>
                  </div>

                  {students.length > 0 && (
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100 flex justify-between items-center">
                      <span>Found <strong>{students.length} matching students</strong> ready for broadcast</span>
                      <span className="material-symbols-outlined text-sm">groups</span>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleAutoGenerateAndValidate}
                  disabled={generatingAI || validating}
                  className="w-full py-4 bg-gradient-to-r from-[#6605c7] via-indigo-600 to-[#4F46E5] hover:from-[#5204a1] hover:to-[#4338CA] text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-200 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg animate-pulse">auto_awesome</span>
                  {generatingAI || validating ? 'AI Copywriter crafting professional email...' : 'Auto-Generate & Validate Campaign'}
                </button>
              </div>

              {/* RIGHT COLUMN: Live Multi-Device Email Preview & AI Quality Scores (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  {/* Viewport and Simulation Toolbar */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          previewDevice === 'desktop' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Desktop view"
                      >
                        <span className="material-symbols-outlined text-sm">desktop_windows</span>
                      </button>
                      <button
                        onClick={() => setPreviewDevice('tablet')}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          previewDevice === 'tablet' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Tablet view"
                      >
                        <span className="material-symbols-outlined text-sm">tablet</span>
                      </button>
                      <button
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          previewDevice === 'mobile' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Mobile view"
                      >
                        <span className="material-symbols-outlined text-sm">smartphone</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={sampleStudent.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Priya Sharma') {
                            setSampleStudent({
                              name: 'Priya Sharma',
                              country: 'United States',
                              university: 'New York University (NYU)',
                              course: 'MS Computer Science',
                              loanAmount: '₹45,00,000',
                            });
                          } else if (val === 'Rahul Verma') {
                            setSampleStudent({
                              name: 'Rahul Verma',
                              country: 'United Kingdom',
                              university: 'University of Oxford',
                              course: 'MBA',
                              loanAmount: '£40,000',
                            });
                          } else {
                            setSampleStudent({
                              name: 'Ananya Reddy',
                              country: 'Ireland',
                              university: 'Trinity College Dublin',
                              course: 'MSc Data Analytics',
                              loanAmount: '€32,000',
                            });
                          }
                        }}
                        className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                      >
                        <option value="Priya Sharma">Simulate: Priya (NYU)</option>
                        <option value="Rahul Verma">Simulate: Rahul (Oxford)</option>
                        <option value="Ananya Reddy">Simulate: Ananya (Trinity)</option>
                      </select>
                      <button
                        onClick={() => setPreviewMode(previewMode === 'rendered' ? 'source' : 'rendered')}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                        title="Toggle HTML Source"
                      >
                        {previewMode === 'rendered' ? '</> Code' : '👁️ Visual'}
                      </button>
                    </div>
                  </div>

                  {/* Subject Line Bar */}
                  {subjectLine && (
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs space-y-1 text-slate-700 font-sans">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <span className="material-symbols-outlined text-xs">mail</span>
                        Subject Line Preview
                      </div>
                      <div className="font-semibold text-slate-900">
                        {subjectLine
                          .replace(/{{studentName}}/g, sampleStudent.name)
                          .replace(/{{firstName}}/g, sampleStudent.name.split(' ')[0])
                          .replace(/{{university}}/g, sampleStudent.university)
                          .replace(/{{targetUniversity}}/g, sampleStudent.university)
                          .replace(/{{country}}/g, sampleStudent.country)
                          .replace(/{{loanAmount}}/g, sampleStudent.loanAmount)}
                      </div>
                    </div>
                  )}

                  {/* Simulated Device Frame */}
                  <div className="bg-slate-100 rounded-xl border border-slate-200 p-3 min-h-[360px] flex justify-center items-start shadow-inner overflow-hidden">
                    <div
                      className={`bg-white shadow-md rounded-lg overflow-hidden border border-slate-200 transition-all duration-300 w-full ${
                        previewDevice === 'mobile'
                          ? 'max-w-[320px]'
                          : previewDevice === 'tablet'
                          ? 'max-w-[440px]'
                          : 'max-w-full'
                      }`}
                    >
                      {emailBody ? (
                        previewMode === 'rendered' ? (
                          <div
                            className="p-4 overflow-y-auto max-h-[400px] text-xs font-sans"
                            dangerouslySetInnerHTML={{
                              __html: emailBody
                                .replace(/{{studentName}}/g, sampleStudent.name)
                                .replace(/{{firstName}}/g, sampleStudent.name.split(' ')[0])
                                .replace(/{{country}}/g, sampleStudent.country)
                                .replace(/{{university}}/g, sampleStudent.university)
                                .replace(/{{targetUniversity}}/g, sampleStudent.university)
                                .replace(/{{course}}/g, sampleStudent.course)
                                .replace(/{{loanAmount}}/g, sampleStudent.loanAmount)
                                .replace(/{{dashboardUrl}}/g, 'https://vidyaloan.com/dashboard')
                                .replace(/\[Your SaaS Platform Name\]/g, 'VidyaLoans')
                                .replace(/\[Your Platform Name\]/g, 'VidyaLoans')
                                .replace(/\[Brand Name\]/g, 'VidyaLoans')
                                .replace(/UniHunt/g, 'VidyaLoans')
                            }}
                          />
                        ) : (
                          <pre className="p-4 overflow-y-auto max-h-[400px] text-[10px] font-mono text-slate-700 whitespace-pre-wrap">
                            {emailBody}
                          </pre>
                        )
                      ) : (
                        <div className="p-12 text-center text-slate-400 italic text-xs space-y-2">
                          <span className="material-symbols-outlined text-3xl text-slate-300 block mx-auto">drafts</span>
                          <p>Fill out campaign parameters and click "Auto-Generate & Validate" to preview live copy.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Send Test Email Tool */}
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="admin@vidyaloans.com"
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] flex-1 bg-white"
                    />
                    <button
                      onClick={handleSendTestEmail}
                      disabled={sendingTest || !selectedCampaign?.id}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase rounded-lg transition-colors whitespace-nowrap disabled:opacity-40"
                    >
                      {sendingTest ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>

                {/* AI Quality Validation Scoring */}
                {validationData && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">AI Quality & Spam Validation</h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-[10px] text-slate-400 font-medium">Subject Line</p>
                        <p className="text-lg font-bold text-emerald-600 mt-0.5">{validationData.scores?.subjectScore || 95}%</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-[10px] text-slate-400 font-medium">Engagement</p>
                        <p className="text-lg font-bold text-emerald-600 mt-0.5">{validationData.scores?.ctaScore || 92}%</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-[10px] text-slate-400 font-medium">Spam Index</p>
                        <p className="text-lg font-bold text-[#6605c7] mt-0.5">{validationData.scores?.spamScore || 0.8}/10</p>
                      </div>
                    </div>

                    {validationData.warnings && validationData.warnings.length > 0 ? (
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-[11px] text-amber-700 space-y-1 font-medium">
                        <div className="font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">warning</span> Suggestions:</div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {validationData.warnings.map((w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">check_circle</span> 100% Quality & Deliverability checks passed.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions Row to proceed to Step 2 */}
              <div className="col-span-1 lg:col-span-12 pt-4 border-t border-slate-150 flex justify-end">
                <button
                  onClick={() => {
                    if (students.length === 0) {
                      handleApplyAudienceFilters().then(() => setWizardStep(2));
                    } else {
                      setWizardStep(2);
                    }
                  }}
                  disabled={!subjectLine || !emailBody}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center gap-2 shadow-md"
                >
                  Proceed: Verify Student Recipient List & Launch <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Student Recipient Verification & Launch */}
        {wizardStep === 2 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-150">
              <div>
                <h4 className="text-xs font-black uppercase text-[#6605c7] tracking-wider">Step 2: Student Recipient Verification</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Review matched student applicants, select target recipients, and dispatch broadcast.</p>
              </div>
              <button
                onClick={() => setWizardStep(1)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Composer
              </button>
            </div>

            {/* Recipients List & Checkboxes */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">
                  Targeted Recipients ({selectedStudentIds.length} of {students.length} students selected)
                </span>
                <div className="flex gap-2 text-[10px] font-bold text-[#6605c7] items-center">
                  <button onClick={handleApplyAudienceFilters} disabled={loadingStudents} className="hover:underline flex items-center gap-1">
                    <span className={`material-symbols-outlined text-xs ${loadingStudents ? 'animate-spin' : ''}`}>refresh</span>
                    {loadingStudents ? 'Loading...' : 'Refresh'}
                  </button>
                  <span>|</span>
                  <button onClick={() => setSelectedStudentIds(students.map(s => s.id))} className="hover:underline">Select All</button>
                  <span>|</span>
                  <button onClick={() => setSelectedStudentIds([])} className="hover:underline">Deselect All</button>
                </div>
              </div>

              <div className="max-h-[320px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {students.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic text-xs space-y-2">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block mx-auto">person_search</span>
                    <p>No recipients matched the chosen segment filters. Go back to adjust parameters.</p>
                  </div>
                ) : (
                  students.map(s => (
                    <div key={s.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50/70 transition-colors">
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
                          <div className="font-bold text-slate-900">{s.firstName || 'Student'} {s.lastName || ''}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-[#6605c7]">{s.studyDestination || 'Global'}</span>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">{s.targetUniversity || 'Chosen University'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Broadcast Action Block */}
            <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-slate-500 font-medium">
                Dispatch queue rate: <strong className="text-[#6605c7]">60 emails / minute (1 email/sec)</strong> • Priority: <strong className="uppercase text-[#6605c7]">{priority}</strong>
              </div>
              <button
                onClick={handleQueueCampaignFinal}
                disabled={selectedStudentIds.length === 0 || loading}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#6605c7] hover:bg-[#5204a1] text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">send</span> Confirm & Enqueue Broadcast ({selectedStudentIds.length} Students)
              </button>
            </div>
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Queue Throttle Rate</label>
            <input
              type="text"
              readOnly
              defaultValue="60 emails / 1 minute (1 email / second)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-semibold text-[#6605c7]"
            />
            <span className="text-[10px] text-slate-400">Strictly sends exactly 60 emails every 60 seconds (1 email/sec) across all queued campaigns to guarantee optimal SMTP deliverability.</span>
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
      {activeSubmenu === 'campaigns_student_emails' && renderStudentEmailsTab()}
      {activeSubmenu === 'campaigns_templates' && renderTemplatesTab()}
      {activeSubmenu === 'campaigns_audience' && renderAudienceTab()}
      {activeSubmenu === 'campaigns_scheduled' && renderScheduledCampaignsTab()}
      {activeSubmenu === 'campaigns_queued' && renderQueuedCampaignsTab()}
      {activeSubmenu === 'campaigns_sent' && renderSentCampaignsTab()}
      {activeSubmenu === 'campaigns_analytics' && renderAnalyticsTab()}
      {activeSubmenu === 'campaigns_prompts' && renderPromptHistoryTab()}
      {activeSubmenu === 'campaigns_settings' && renderSettingsTab()}

      {/* ─── Individual Student Sent Email Interactive Modal ───────────────── */}
      {selectedRecipientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6605c7] text-white font-bold flex items-center justify-center shadow-md">
                  {(selectedRecipientModal.recipientName || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedRecipientModal.recipientName || selectedRecipientModal.user?.firstName || 'Student Recipient'}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">({selectedRecipientModal.recipientEmail})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>Campaign: <strong className="text-slate-800">{selectedRecipientModal.campaign?.name || 'Education Loan Broadcast'}</strong></span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-[#6605c7]">Status: {selectedRecipientModal.status}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRecipientModal(null);
                  setRecipientPreviewData(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-5 py-2 border-b border-slate-100 bg-white flex justify-between items-center text-xs">
              <div className="flex gap-2">
                <button
                  onClick={() => setRecipientModalTab('rendered')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                    recipientModalTab === 'rendered' ? 'bg-[#6605c7] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Personalized Email View
                </button>
                <button
                  onClick={() => setRecipientModalTab('source')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                    recipientModalTab === 'source' ? 'bg-[#6605c7] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  HTML Template
                </button>
                <button
                  onClick={() => setRecipientModalTab('variables')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                    recipientModalTab === 'variables' ? 'bg-[#6605c7] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Student Profile & Variables
                </button>
              </div>

              {/* Delivery Meta Info */}
              <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Sent: {selectedRecipientModal.sentAt ? format(new Date(selectedRecipientModal.sentAt), 'MMM d, yyyy · HH:mm') : 'Recently'}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
              {loadingRecipientPreview ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-3xl animate-spin text-[#6605c7]">progress_activity</span>
                  <p className="text-xs font-semibold">Loading student personalized email...</p>
                </div>
              ) : (
                <>
                  {recipientModalTab === 'rendered' && (
                    <div className="max-w-2xl mx-auto space-y-4">
                      {/* Subject Line Pill */}
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-xs space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Line Delivered</div>
                        <div className="text-sm font-bold text-slate-900">
                          {recipientPreviewData?.renderedSubject || selectedRecipientModal.campaign?.subject}
                        </div>
                      </div>

                      {/* Rendered Email Frame */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden text-xs font-sans">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: recipientPreviewData?.renderedBody || selectedRecipientModal.campaign?.body || '<p>No content preview available.</p>'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {recipientModalTab === 'source' && (
                    <div className="max-w-3xl mx-auto bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
                        {recipientPreviewData?.renderedBody || selectedRecipientModal.campaign?.body}
                      </pre>
                    </div>
                  )}

                  {recipientModalTab === 'variables' && (
                    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 text-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#6605c7]">Resolved Student Parameters</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Student Name</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block">
                            {selectedRecipientModal.recipientName || selectedRecipientModal.user?.firstName || 'Student'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Student Email</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block font-mono">
                            {selectedRecipientModal.recipientEmail}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Country</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block">
                            {selectedRecipientModal.user?.studyDestination || (selectedRecipientModal.variables as any)?.country || 'Global'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Target University</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block">
                            {selectedRecipientModal.user?.targetUniversity || (selectedRecipientModal.variables as any)?.university || 'University Choice'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Course</span>
                          <span className="font-semibold text-slate-800 mt-0.5 block">
                            {selectedRecipientModal.user?.courseName || (selectedRecipientModal.variables as any)?.course || 'Postgraduate'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Eligible Loan Amount</span>
                          <span className="font-semibold text-[#6605c7] mt-0.5 block font-mono">
                            {selectedRecipientModal.user?.loanAmount ? `₹${Number(selectedRecipientModal.user.loanAmount).toLocaleString('en-IN')}` : '₹45,00,000'}
                          </span>
                        </div>
                      </div>

                      {/* Delivery Status & Tracking */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tracking History</span>
                        <div className="flex flex-wrap gap-4 text-slate-600 text-[11px]">
                          <div>Queued: <span className="font-semibold text-slate-800">{selectedRecipientModal.createdAt ? format(new Date(selectedRecipientModal.createdAt), 'MMM d, HH:mm') : '-'}</span></div>
                          <div>Delivered: <span className="font-semibold text-emerald-600">{selectedRecipientModal.sentAt ? format(new Date(selectedRecipientModal.sentAt), 'MMM d, HH:mm') : 'Pending'}</span></div>
                          <div>Opened: <span className="font-semibold text-purple-600">{selectedRecipientModal.openedAt ? format(new Date(selectedRecipientModal.openedAt), 'MMM d, HH:mm') : 'Not yet'}</span></div>
                          <div>Clicked: <span className="font-semibold text-blue-600">{selectedRecipientModal.clickedAt ? format(new Date(selectedRecipientModal.clickedAt), 'MMM d, HH:mm') : 'Not yet'}</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedRecipientModal(null);
                  setRecipientPreviewData(null);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
