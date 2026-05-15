import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { documentApi, staffProfileApi } from "@/lib/api";

interface ApplicationDetailViewProps {
  application: any;
  onBack: () => void;
}



const ApplicationDetailView: React.FC<ApplicationDetailViewProps> = ({
  application,
  onBack,
}) => {
  const getRequiredDocuments = (employmentType: string, personName: string, personType: 'father' | 'mother' | 'coapplicant') => {
    const docs: any[] = [];
    const typePrefix = personType === 'father' ? 'father' : personType === 'mother' ? 'mother' : 'coapplicant';
    
    docs.push({ name: `${personName}'s Aadhar Card`, type: `${typePrefix}_aadhar`, required: true });
    docs.push({ name: `${personName}'s PAN Card`, type: `${typePrefix}_pan`, required: true });
    
    if (employmentType === 'employed') {
        docs.push({ name: `${personName} - Last 3 months Salary Slips`, type: `${typePrefix}_salary_slips`, required: true });
        docs.push({ name: `${personName} - Last 6 months Bank Statements`, type: `${typePrefix}_bank_statements`, required: true });
    } else if (employmentType === 'self_employed_business' || employmentType === 'self_employed_professional') {
        docs.push({ name: `${personName} - Business Registration/License`, type: `${typePrefix}_business_license`, required: true });
        docs.push({ name: `${personName} - Last 6 months Bank Statements`, type: `${typePrefix}_bank_statements`, required: true });
        docs.push({ name: `${personName} - Last 2 years ITR`, type: `${typePrefix}_itr`, required: true });
    } else if (employmentType === 'retired') {
        docs.push({ name: `${personName} - Pension/Retirement Document`, type: `${typePrefix}_retirement_cert`, required: true });
        docs.push({ name: `${personName} - Last 6 months Bank Statements`, type: `${typePrefix}_bank_statements`, required: true });
    }
    return docs;
  };

  const [activeTab, setActiveTab] = useState("requirements");
  const [activeSidebarMenu, setActiveSidebarMenu] = useState("application_details");

  const progress = application.progress || 90;
  const status = (application.status || "APPROVED").toUpperCase();
  const appId = `APP${(application.id || application._id || "MO2V2P4UQZEU").slice(-10).toUpperCase()}`;
  const studentId = (application.studentId || "482C9247-D456-4BF7-AF41-1AA98B4C9A06").toUpperCase();
  
  const [messages, setMessages] = useState([
    { id: 1, sender: "staff", text: `Hello ${application.firstName || "Applicant"}, we noticed that your 10th standard marksheet is slightly blurred. Could you please upload a clearer scan?`, time: "10:45 AM", type: "chat" },
    { id: 2, sender: "student", text: "Sure, I'll upload it right away. Give me 5 minutes.", time: "11:12 AM", type: "chat" },
    { id: 3, sender: "system", text: "New Document Uploaded: Marksheet_10th_Final.pdf", time: "11:15 AM", type: "notification" },
  ]);
  const [notes, setNotes] = useState([
    { id: 1, author: "Ananya Deshmukh", role: "Senior Auditor", text: "Student has excellent academic pedigree. Waitlisted at UofT but current profile shows high employability in data science. Financials look solid; father's income is consistent for last 3 years.", time: "2 DAYS AGO" },
    { id: 2, author: "Staff Member", role: "Relationship Manager", text: "Requested a clearer scan of 10th marksheet. Verification pending for academic section.", time: "TODAY • 10:15 AM" },
  ]);
  const [msgInput, setMsgInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  
  // Dynamic Documents State
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const userId = application.userId || application.user_id || application.applicantId;

  const fetchDocuments = async () => {
    if (!userId) return;
    setLoadingDocs(true);
    try {
      const res = await documentApi.getUserDocuments(userId);
      if (res.success && res.data) {
        const mappedDocs = res.data.map((d: any) => ({
          id: d.id,
          name: (d.docName || d.docType || "Document").replace(/_/g, ' ').toUpperCase(),
          category: d.docType.includes('aadhar') || d.docType.includes('pan') || d.docType.includes('identity') ? 'identity' : 
                    d.docType.includes('salary') || d.docType.includes('bank') || d.docType.includes('itr') ? 'financial' : 'academic',
          status: d.status || 'pending',
          fileName: d.filePath ? d.filePath.split(/[/\\]/).pop() : '',
          accuracy: d.verificationMetadata?.confidence || (d.status === 'verified' ? 100 : 0),
          fieldsExtracted: d.verificationMetadata?.extractedFields ? Object.keys(d.verificationMetadata.extractedFields).length : 0,
          docType: d.docType
        }));
        setDocuments(mappedDocs);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("academic");

  const handleSendMessage = () => {
    if (!msgInput.trim()) return;
    const newMessage = {
      id: Date.now(),
      sender: "staff",
      text: msgInput,
      time: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) + " IST",
      type: "chat"
    };
    setMessages([...messages, newMessage]);
    setMsgInput("");
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNote = {
      id: Date.now(),
      author: "Staff Member",
      role: "Level 4 Admin",
      text: noteInput,
      time: "JUST NOW"
    };
    setNotes([...notes, newNote]);
    setNoteInput("");
  };

  const handleAddDocument = async () => {
    if (!newDocName.trim() || !userId) return;
    
    // Create a docType from name
    const docType = newDocName.toLowerCase().replace(/\s+/g, '_');
    
    try {
      // In a real app, we might call an API to create a "requirement" 
      // For now, we'll just add it to local state to allow immediate upload,
      // but ideally we should persist this "requirement" status.
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: newDocName,
        category: newDocCategory,
        status: 'pending',
        fileName: '',
        accuracy: 0,
        fieldsExtracted: 0,
        docType: docType
      };
      setDocuments([...documents, newDoc]);
      setNewDocName("");
      setIsAddDocModalOpen(false);
    } catch (err) {
      console.error("Failed to add requirement:", err);
    }
  };

  const handleFileUpload = async (docIdOrType: string, file: File) => {
    if (!userId) return;
    
    // Find docType from either ID or direct Type string
    const doc = documents.find(d => d.id === docIdOrType || d.docType === docIdOrType);
    const docType = doc ? doc.docType : docIdOrType;

    try {
      const res = await documentApi.upload(userId, docType, file);
      if (res.success) {
        fetchDocuments(); // Refresh from server
        
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: "system",
          text: `Document Uploaded: ${file.name}`,
          time: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()) + " IST",
          type: "notification"
        }]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload document");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !userId) return;

    if (!confirm(`Are you sure you want to delete ${doc.name}?`)) return;

    try {
      const res = await documentApi.delete(userId, doc.docType);
      if (res.success) {
        fetchDocuments();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };
  
  const createdDateIST = (() => {
    const ds = application.createdAt || application.created_at || application.student?.createdAt || application.student?.created_at;
    if (!ds) return "—";
    try {
      const date = new Date(ds);
      if (isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }).format(date) + " IST";
    } catch (e) { return "—"; }
  })();

  const shortCreatedDateIST = (() => {
    const ds = application.createdAt || application.created_at || application.student?.createdAt || application.student?.created_at;
    if (!ds) return "PENDING"; 
    try {
      const date = new Date(ds);
      if (isNaN(date.getTime())) return "PENDING";
      return new Intl.DateTimeFormat('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }).format(date);
    } catch (e) { return "PENDING"; }
  })();

  const stages = [
    { label: "APPLICATION CREATED", date: shortCreatedDateIST, completed: progress >= 10 },
    { label: "APPLICATION SUBMITTED", date: shortCreatedDateIST, completed: progress >= 25 },
    { label: "DOCUMENTS VERIFICATION", date: "PENDING", completed: progress >= 40 },
    { label: "SUBMIT TO BANK", date: "PENDING", completed: progress >= 60 },
    { label: "CREDIT CHECK", date: "PENDING", completed: progress >= 75 },
    { label: "BANK APPROVED", date: "PENDING", completed: progress >= 90, active: progress < 90 },
    { label: "SANCTION", date: "PENDING", completed: progress >= 95 },
    { label: "DISBURSEMENT", date: "—", completed: progress >= 100 },
  ];

  const getBankLogo = () => {
    const bName = (application.bank || application.targetBank || "").toLowerCase();
    if (bName.includes("idfc")) return "/images/lenders/idfc-first-bank.jpg";
    if (bName.includes("avanse")) return "/images/lenders/avanse.jpg";
    if (bName.includes("auxilo")) return "/images/lenders/auxilo.png";
    if (bName.includes("credila") || bName.includes("hdfc")) return "/images/lenders/hdfc-credila.png";
    if (bName.includes("poonawalla")) return "/images/lenders/poonawalla.png";
    return null;
  };

  return (
    <div className="fixed inset-y-0 right-0 left-[56px] z-[40] flex flex-col bg-[#F8FAFC] overflow-hidden animate-in fade-in duration-500" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/50 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[40%] bg-emerald-50/50 blur-[100px] rounded-full -z-10" />

      {/* Top Navbar - Glassmorphism */}
      <div className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 shrink-0 sticky top-0 z-[80] shadow-sm">
        <div className="flex flex-col">
          <p className="text-[10px] font-['Playfair_Display',serif] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">STAFF DASHBOARD</p>
          <h1 className="text-[24px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Application Detail</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-indigo-500 transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Search applications, students, IDs..." 
              className="pl-12 pr-6 py-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-[13px] w-[340px] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all relative">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200/60 mx-1"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-[12px] font-black text-slate-900">Staff Member</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level 4 Admin</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">person</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Secondary Left Menu */}
        <div className="w-[120px] bg-white/60 backdrop-blur-xl border-r border-slate-100/50 flex flex-col py-8 px-4 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="space-y-4">
            {[
              { id: 'application_details', label: 'Application\ndetails', icon: 'description' },
              { id: 'student', label: 'Student', icon: 'person' },
              { id: 'exams', label: 'Exams', icon: 'school' },
            ].map(menu => (
              <button
                key={menu.id}
                onClick={() => setActiveSidebarMenu(menu.id)}
                className={`w-full flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all group ${
                  activeSidebarMenu === menu.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="mb-2">
                  <span className="material-symbols-outlined text-[24px]">{menu.icon}</span>
                </div>
                <span className="text-[10px] font-bold text-center leading-tight whitespace-pre-wrap">{menu.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeSidebarMenu === 'application_details' && (
            <div className="max-w-[1400px] mx-auto p-10 space-y-10 animate-in fade-in zoom-in-95 duration-300">
            
            {/* Breadcrumb / Back Navigation */}
          <div className="flex items-center gap-5">
            <button 
              onClick={onBack}
              className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
               </div>
               <h2 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Education Loan Terminal</h2>
            </div>
          </div>

          {/* Main Info Card - Glassmorphism & Rich Styling */}
          <div className="bg-white/70 backdrop-blur-sm rounded-[40px] p-10 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100/40 transition-colors duration-1000" />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex gap-8">
                {/* Bank Logo Area */}
                <div className="w-24 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shrink-0 shadow-sm border border-slate-50 group-hover:shadow-md transition-all duration-500">
                  {getBankLogo() ? (
                    <img src={getBankLogo()!} alt="Bank" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-300 text-[32px]">account_balance</span>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-[11px] font-['Playfair_Display',serif] font-black text-slate-400 uppercase tracking-[0.25em]">UNIVERSITY OF {(application.universityName || application.college || "TORONTO").toUpperCase()}</p>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100/50 tracking-widest uppercase shadow-sm">{status}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <h3 className="text-[36px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] tracking-tight">{application.firstName || application.student?.firstName || "Abhi"} {application.lastName || application.student?.lastName || "Y"}</h3>
                      <div className="w-px h-8 bg-slate-200" />
                      <p className="text-[20px] font-bold text-indigo-600/90">{application.courseName || application.program || "MS/M.Tech"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">STUDENT IDENTIFIER</p>
                      <p className="text-[12px] font-bold text-slate-600">{studentId}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-100" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">APPLICATION ID</p>
                      <p className="text-[12px] font-bold text-slate-600">{appId}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-100" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">COURSE CATEGORY</p>
                      <p className="text-[12px] font-bold text-slate-600">{application.courseLevel || "POSTGRADUATE ABROAD"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-16 items-center pr-6">
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">LOAN AMOUNT APPLIED</p>
                  <p className="text-[44px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] leading-none tracking-tighter">₹{Number(application.loanAmount || 3999999).toLocaleString()}</p>
                </div>

                <div className="relative w-28 h-28 flex items-center justify-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -top-5 whitespace-nowrap">PROGRESS QUOTA</p>
                   <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100/80" />
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={301.6} strokeDashoffset={301.6 - (301.6 * progress) / 100} strokeLinecap="round" className="text-indigo-600 transition-all duration-1000 ease-out" />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                      <span className="text-[22px] font-black text-indigo-600 leading-none">{progress}%</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Progress Timeline - Clean & Dynamic */}
            <div className="mt-16 relative px-6">
              <div className="absolute top-[18px] left-12 right-12 h-[4px] bg-slate-100 rounded-full" />
              <div className="absolute top-[18px] left-12 h-[4px] bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `calc(${(stages.filter(s => s.completed).length - 1) / (stages.length - 1) * 100}% - 48px)` }} />
              
              <div className="flex justify-between relative z-10">
                {stages.map((stage, idx) => (
                  <div key={idx} className="flex flex-col items-center group/stage">
                    <div className={`w-10 h-10 rounded-full border-[5px] border-white shadow-lg flex items-center justify-center transition-all duration-500 group-hover/stage:scale-110 ${stage.completed ? (stage.active ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-100') : 'bg-slate-200 shadow-none'}`}>
                      {stage.completed ? (
                        <span className="material-symbols-outlined text-white text-[18px] font-black">check</span>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/50" />
                      )}
                    </div>
                    <div className="mt-5 text-center">
                      <p className={`text-[10px] font-black tracking-widest transition-colors mb-2 ${stage.active ? 'text-emerald-600' : stage.completed ? 'text-slate-800' : 'text-slate-400'}`}>{stage.label}</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${stage.active ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm' : 'bg-slate-50/80 border-slate-100 text-slate-400'}`}>
                         <span className="material-symbols-outlined text-[14px]">{stage.active ? 'verified' : 'schedule'}</span>
                         <span className="text-[9px] font-bold tracking-wider">{stage.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Hub & Tabs Section */}
          <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700 delay-200">
            <div className="flex items-center justify-between border-b border-slate-200/60 px-4">
              <div className="flex items-center gap-16">
                {[
                  { id: "requirements", label: "REQUIREMENTS", icon: "task_alt" },
                  { id: "records", label: "STUDENT RECORDS", icon: "folder_shared" },
                  { id: "notes", label: "INTERNAL NOTES", icon: "sticky_note_2" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-5 flex items-center gap-3 text-[13px] font-black tracking-[0.15em] uppercase relative transition-all group ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <span className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-300'}`}>{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-[4px] bg-indigo-600 rounded-full shadow-[0_4px_10px_rgba(79,70,229,0.3)]" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-4">
                 <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    Export PDF
                 </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-12 gap-10">
               {/* Left Column: Dynamic Content based on Tab */}
               <div className="col-span-8 space-y-10">
                  {activeTab === "requirements" && (
                    <div className="space-y-12">
                      {/* Academic Credentials */}
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-5 duration-500">
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-sm">
                                 <span className="material-symbols-outlined text-[24px]">school</span>
                              </div>
                              <div>
                                <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Academic Credentials</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">MANDATORY VERIFICATION</p>
                              </div>
                           </div>
                           <button 
                            onClick={() => {
                              setNewDocCategory("academic");
                              setIsAddDocModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:border-indigo-500 hover:bg-indigo-50 transition-all shadow-sm"
                           >
                              <span className="material-symbols-outlined text-[18px]">add_circle</span>
                              Define Requirement
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          {documents.filter(d => d.category === 'academic').map(doc => (
                            <DocumentCard 
                              key={doc.id} 
                              doc={doc} 
                              onUpload={(file) => handleFileUpload(doc.id, file)}
                              onDelete={() => handleDeleteDocument(doc.id)}
                            />
                          ))}
                          
                          <button 
                            onClick={() => {
                              setNewDocCategory("academic");
                              setIsAddDocModalOpen(true);
                            }}
                            className="bg-white/40 backdrop-blur-sm rounded-[32px] border border-slate-100 p-8 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 shadow-inner group hover:bg-white/60 transition-all cursor-pointer"
                          >
                             <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[28px]">add</span>
                             </div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Add Academic Doc</p>
                          </button>
                        </div>
                      </div>

                      {/* Financial & Identity Dossier */}
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-5 duration-500 delay-100">
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-sm">
                                 <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                              </div>
                              <div>
                                <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Financial & Identity</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">KYC & INCOME PROOF</p>
                              </div>
                           </div>
                           <button 
                            onClick={() => {
                              setNewDocCategory("financial");
                              setIsAddDocModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:border-indigo-500 hover:bg-indigo-50 transition-all shadow-sm"
                           >
                              <span className="material-symbols-outlined text-[18px]">add_circle</span>
                              Add Financial
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           {documents.filter(d => d.category === 'financial' || d.category === 'identity').map(doc => (
                              <DocumentCard 
                                key={doc.id} 
                                doc={doc} 
                                onUpload={(file) => handleFileUpload(doc.id, file)}
                                onDelete={() => handleDeleteDocument(doc.id)}
                              />
                           ))}
                           
                           <button 
                            onClick={() => {
                              setNewDocCategory("financial");
                              setIsAddDocModalOpen(true);
                            }}
                            className="bg-white/40 backdrop-blur-sm rounded-[32px] border border-slate-100 p-8 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 shadow-inner group hover:bg-white/60 transition-all cursor-pointer"
                          >
                             <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[28px]">add</span>
                             </div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Add Identity Doc</p>
                          </button>
                        </div>
                      </div>

                      {/* Family & Co-applicant Dossier */}
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-5 duration-500 delay-200">
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shadow-sm">
                                 <span className="material-symbols-outlined text-[24px]">family_restroom</span>
                              </div>
                              <div>
                                <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Family & Co-applicant</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">PARENTAL VERIFICATION</p>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                          {[
                            { name: application.fatherName || "Father", type: 'father', employment: application.fatherEmployment || 'employed' },
                            { name: application.motherName || "Mother", type: 'mother', employment: application.motherEmployment || 'employed' },
                            { name: application.coApplicantName || "Co-applicant", type: 'coapplicant', employment: application.coApplicantEmployment || 'not_employed' }
                          ].map((person, idx) => (
                            <div key={idx} className="bg-white/60 backdrop-blur-md rounded-[32px] border border-slate-100 p-6 shadow-sm">
                              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                    {person.name[0]}
                                  </div>
                                  <div>
                                    <h4 className="text-[14px] font-bold text-slate-900">{person.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{person.type.replace('_', ' ')} • {person.employment.replace('_', ' ')}</p>
                                  </div>
                                </div>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">DETAILS SYNCED</span>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                {getRequiredDocuments(person.employment, person.name, person.type as any).map((reqDoc, rIdx) => {
                                  const existingDoc = documents.find(d => d.docType === reqDoc.type);
                                  const fileInputRef = React.createRef<HTMLInputElement>();
                                  
                                  return (
                                    <div key={rIdx} className={`flex items-center justify-between p-3 rounded-2xl bg-white border transition-all ${existingDoc?.status === 'verified' ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 hover:border-indigo-200'}`}>
                                      <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(reqDoc.type, e.target.files[0])}
                                      />
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${existingDoc ? (existingDoc.status === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600') : (reqDoc.required ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400')}`}>
                                          <span className="material-symbols-outlined text-[18px]">{existingDoc ? 'verified' : 'description'}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[11px] font-bold text-slate-700 leading-tight truncate">{reqDoc.name}</p>
                                          <p className={`text-[9px] font-bold uppercase ${existingDoc?.status === 'verified' ? 'text-emerald-500' : existingDoc ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {existingDoc ? (existingDoc.status || 'Uploaded') : 'Pending Upload'}
                                          </p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">{existingDoc ? 'sync' : 'upload'}</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "records" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                      <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-[650px]">
                        {/* Chat Header */}
                        <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                              <span className="material-symbols-outlined text-[24px]">forum</span>
                            </div>
                            <div>
                              <h3 className="text-[18px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Communication Hub</h3>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">DIRECT TWO-WAY CHANNEL</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              STUDENT ONLINE
                            </span>
                          </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-80">
                          <div className="flex flex-col items-center mb-8">
                            <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversation Started</span>
                          </div>

                          {messages.map((msg) => (
                            <React.Fragment key={msg.id}>
                              {msg.type === "notification" ? (
                                <div className="flex justify-center">
                                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[11px] font-bold">
                                    <span className="material-symbols-outlined text-[16px]">file_present</span>
                                    {msg.text}
                                  </div>
                                </div>
                              ) : (
                                <div className={`flex flex-col space-y-2 ${msg.sender === "staff" ? "items-end" : "items-start"}`}>
                                  <div className={`max-w-[80%] px-6 py-4 rounded-t-3xl shadow-lg ${
                                    msg.sender === "staff" 
                                      ? "bg-indigo-600 text-white rounded-bl-3xl shadow-indigo-100" 
                                      : "bg-white border border-slate-100 text-slate-700 rounded-br-3xl shadow-sm"
                                  }`}>
                                    <p className="text-[14px] leading-relaxed">{msg.text}</p>
                                  </div>
                                  <p className={`text-[10px] font-bold text-slate-400 ${msg.sender === "staff" ? "mr-2" : "ml-2"}`}>
                                    {msg.sender === "staff" ? "STAFF" : "STUDENT"} • {msg.time}
                                  </p>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Chat Input */}
                        <div className="p-8 bg-white border-t border-slate-100">
                          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-3xl p-2 pl-6 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                            <input 
                              type="text" 
                              value={msgInput}
                              onChange={(e) => setMsgInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                              placeholder="Request documents or ask for information..." 
                              className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] py-3 font-medium placeholder:text-slate-400"
                            />
                            <button 
                              onClick={handleSendMessage}
                              className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
                            >
                              <span className="material-symbols-outlined text-[24px]">send</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "notes" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                      <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100">
                              <span className="material-symbols-outlined text-[24px]">sticky_note_2</span>
                            </div>
                            <div>
                              <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Internal Staff Notes</h3>
                              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">CONFIDENTIAL • STAFF ONLY</p>
                            </div>
                          </div>
                          <button 
                            onClick={handleAddNote}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0d1b2a] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            New Note
                          </button>
                        </div>

                        <div className="space-y-4">
                          {notes.map((note) => (
                            <div key={note.id} className="p-8 rounded-[32px] bg-slate-50/80 border border-slate-100 hover:border-amber-200 transition-all group">
                               <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                                       {note.author.split(' ').map(n => n[0]).join('')}
                                     </div>
                                     <p className="text-[12px] font-black text-slate-900">{note.author} <span className="font-medium text-slate-400 ml-2">{note.role}</span></p>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{note.time}</p>
                               </div>
                               <p className="text-[14px] text-slate-600 leading-relaxed">{note.text}</p>
                            </div>
                          ))}
                        </div>

                        {/* Quick Note Input */}
                        <div className="pt-6 border-t border-slate-100">
                           <textarea 
                             rows={3} 
                             value={noteInput}
                             onChange={(e) => setNoteInput(e.target.value)}
                             placeholder="Write an internal observation or note..." 
                             className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl p-6 text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/50 transition-all resize-none"
                           />
                        </div>
                      </div>
                    </div>
                  )}
               </div>

               {/* Right Column: Insights & Quick Actions */}
               <div className="col-span-4 space-y-8">
                  {/* Intelligent AI Audit Card */}
                  <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1e293b] rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
                     <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />
                     
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform">
                              <span className="material-symbols-outlined text-[20px] text-emerald-400">psychology</span>
                           </div>
                           <h4 className="text-[16px] font-bold tracking-tight">AI Dossier Insights</h4>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                              <p className="text-[11px] font-medium text-slate-300 leading-relaxed">Financial risk profile is low. Consistent income verified via Form 16 extraction.</p>
                           </div>
                           <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                              <p className="text-[11px] font-medium text-slate-300 leading-relaxed">Academic merit matches University of Toronto admission benchmarks.</p>
                           </div>
                        </div>

                        <button className="w-full mt-8 py-3.5 bg-emerald-500 text-[#0d1b2a] rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                           Approve Final Audit
                        </button>
                     </div>
                  </div>

                  {/* Contact Quick Links */}
                  <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                     <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest mb-6">Direct Communication</h4>
                     <div className="space-y-3">
                        <button 
                           onClick={() => setActiveTab('records')}
                           className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                        >
                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm">
                              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                           </div>
                           <div className="flex-1">
                              <p className="text-[12px] font-bold text-slate-900">Message Student</p>
                              <p className="text-[10px] font-medium text-slate-400">Via Platform Chat</p>
                           </div>
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group">
                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-emerald-600 shadow-sm">
                              <span className="material-symbols-outlined text-[20px]">video_call</span>
                           </div>
                           <div className="flex-1">
                              <p className="text-[12px] font-bold text-slate-900">Schedule Interview</p>
                              <p className="text-[10px] font-medium text-slate-400">Google Meet Sync</p>
                           </div>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

          {activeSidebarMenu === 'student' && (
            <div className="max-w-[1400px] mx-auto p-10 space-y-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-5">
                <button 
                  onClick={onBack}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Student Profile</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registered: {createdDateIST}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-[40px] p-10 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative">
                  <div className="flex gap-16">
                     <div className="flex-1 space-y-8">
                       <section>
                         <h3 className="text-[14px] font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><span className="material-symbols-outlined text-emerald-500">person</span> Personal Information</h3>
                         <div className="grid grid-cols-3 gap-6">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Registration Time</p>
                               <p className="text-[14px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">{createdDateIST}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">First Name</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.firstName || application.student?.firstName || "—"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Name</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.lastName || application.student?.lastName || "—"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date of Birth</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.dob || application.student?.dob || "—"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.email || application.student?.email || "—"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.phone || application.student?.phone || application.mobile || "—"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gender</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.gender || application.student?.gender || "—"}</p>
                            </div>
                         </div>
                       </section>

                       <section>
                         <h3 className="text-[14px] font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><span className="material-symbols-outlined text-emerald-500">location_on</span> Address Details</h3>
                         <div className="grid grid-cols-2 gap-6">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Address</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.address || application.student?.mailingAddress?.address1 || application.student?.address || "—"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">City / Pincode</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.city || application.student?.mailingAddress?.city || "—"} - {application.pincode || application.student?.mailingAddress?.pincode || "—"}</p>
                            </div>
                         </div>
                       </section>

                       <section>
                         <h3 className="text-[14px] font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><span className="material-symbols-outlined text-emerald-500">public</span> Nationality & Background</h3>
                         <div className="grid grid-cols-3 gap-6">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nationality</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.nationality || application.student?.nationality?.name || "Indian"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Visa Refusal</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.student?.background?.visaRefusal || "No"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Medical Condition</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.student?.background?.medicalCondition || "No"}</p>
                            </div>
                         </div>
                       </section>

                       <section>
                         <h3 className="text-[14px] font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><span className="material-symbols-outlined text-emerald-500">contact_emergency</span> Emergency Contact</h3>
                         <div className="grid grid-cols-3 gap-6">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Name</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.student?.emergencyContact?.name || application.emergencyContactName || "—"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Relation</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.student?.emergencyContact?.relation || application.emergencyContactRelation || "—"}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                               <p className="text-[14px] font-semibold text-slate-900">{application.student?.emergencyContact?.phone || application.emergencyContactPhone || "—"}</p>
                            </div>
                         </div>
                       </section>
                     </div>
                  </div>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Modals & Sub-components */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0d1b2a]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddDocModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[20px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">Add Document Requirement</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define what the student needs to upload</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Document Name</label>
                <input 
                  type="text" 
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Master's Admission Letter"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {['academic', 'financial', 'identity'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setNewDocCategory(cat)}
                      className={`py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                        newDocCategory === cat 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setIsAddDocModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddDocument}
                disabled={!newDocName.trim()}
                className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
              >
                Create Requirement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for better organization ---

const DocumentCard = ({ doc, onUpload, onDelete }: { doc: any, onUpload: (file: File) => void, onDelete: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const getIcon = () => {
    switch(doc.category) {
      case 'academic': return 'school';
      case 'financial': return 'account_balance_wallet';
      case 'identity': return 'fingerprint';
      default: return 'article';
    }
  };

  const getStatusColor = () => {
    switch(doc.status) {
      case 'verified': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'uploaded': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 group/card relative overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />
      
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <button onClick={onDelete} className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors">
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm group-hover/card:scale-105 transition-transform ${getStatusColor()}`}>
          <span className="material-symbols-outlined text-[28px]">{getIcon()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-bold text-[#0d1b2a] truncate">{doc.name}</h4>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            {doc.status === 'pending' ? 'ACTION REQUIRED' : `${doc.fieldsExtracted || 0} FIELDS EXTRACTED`}
          </p>
        </div>
      </div>

      {doc.status === 'pending' ? (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          Upload Now
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{doc.fileName}</span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase">{doc.accuracy?.toFixed(1)}% ACC</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${doc.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${doc.accuracy || 0}%` }} 
            />
          </div>
          <div className="flex items-center justify-between pt-1">
             <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View File</button>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
             >
               Re-upload
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailView;
