"use client";
/**
 * Cross-Portal Data Sharing Dashboard
 * Shows what data is available in each portal and how it flows
 */

interface PortalDataMap {
  student: {
    available: string[];
    canModify: string[];
    color: string;
  };
  staff: {
    available: string[];
    canModify: string[];
    color: string;
  };
  bank: {
    available: string[];
    canModify: string[];
    color: string;
  };
}

const PORTAL_DATA_MAP: PortalDataMap = {
  student: {
    available: [
      'Personal Information',
      'Academic History',
      'Work Experience',
      'Documents (Upload)',
      'Application Status',
      'Messages from Staff'
    ],
    canModify: [
      'Personal Information',
      'Academic History',
      'Work Experience',
      'Document Uploads',
      'Profile Settings'
    ],
    color: 'from-blue-500 to-blue-600'
  },
  staff: {
    available: [
      'All Student Data',
      'Document Library',
      'Bank Information',
      'Share History',
      'Document Status',
      'Bank Communication',
      'Analytics'
    ],
    canModify: [
      'Document Status',
      'Internal Notes',
      'Document Sharing',
      'Bank Assignments',
      'Application Status'
    ],
    color: 'from-purple-500 to-purple-600'
  },
  bank: {
    available: [
      'Shared Documents',
      'Student Basic Info',
      'Academic Credentials',
      'Document Metadata',
      'Share Access Details'
    ],
    canModify: [
      'Application Status',
      'Document Review Notes',
      'Loan Decision'
    ],
    color: 'from-emerald-500 to-emerald-600'
  }
};

export default function CrossPortalDataDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-[28px] font-black text-slate-900 tracking-tight mb-2">
          Cross-Portal Data Sharing
        </h2>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          What data is shared between student, staff, and bank portals
        </p>
      </div>

      {/* Portal Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Portal */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div>
              <h3 className="text-[18px] font-black text-blue-900">Student</h3>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Source Portal</p>
            </div>
          </div>

          {/* Available Data */}
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-900 mb-3">Data Available</p>
            <div className="space-y-2">
              {PORTAL_DATA_MAP.student.available.map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">check_circle</span>
                  <span className="text-[12px] font-medium text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Can Modify */}
          <div className="pt-4 border-t border-blue-200">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-900 mb-3">Can Modify</p>
            <div className="space-y-2">
              {PORTAL_DATA_MAP.student.canModify.map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-blue-100/40 rounded-lg">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">edit</span>
                  <span className="text-[12px] font-medium text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Portal */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-3xl p-6 shadow-sm ring-2 ring-purple-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
            </div>
            <div>
              <h3 className="text-[18px] font-black text-purple-900">Staff Hub</h3>
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Intermediary</p>
            </div>
          </div>

          {/* Available Data */}
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-purple-900 mb-3">Data Available</p>
            <div className="space-y-2">
              {PORTAL_DATA_MAP.staff.available.map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                  <span className="material-symbols-outlined text-[16px] text-purple-600">check_circle</span>
                  <span className="text-[12px] font-medium text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Can Modify */}
          <div className="pt-4 border-t border-purple-200">
            <p className="text-[11px] font-bold uppercase tracking-widest text-purple-900 mb-3">Can Modify</p>
            <div className="space-y-2">
              {PORTAL_DATA_MAP.staff.canModify.map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-purple-100/40 rounded-lg">
                  <span className="material-symbols-outlined text-[16px] text-purple-600">edit</span>
                  <span className="text-[12px] font-medium text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bank Portal */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[24px]">business</span>
            </div>
            <div>
              <h3 className="text-[18px] font-black text-emerald-900">Bank</h3>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Consumer Portal</p>
            </div>
          </div>

          {/* Available Data */}
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-900 mb-3">Data Available</p>
            <div className="space-y-2">
              {PORTAL_DATA_MAP.bank.available.map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span className="text-[12px] font-medium text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Can Modify */}
          <div className="pt-4 border-t border-emerald-200">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-900 mb-3">Can Modify</p>
            <div className="space-y-2">
              {PORTAL_DATA_MAP.bank.canModify.map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-emerald-100/40 rounded-lg">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">edit</span>
                  <span className="text-[12px] font-medium text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Flow Explanation */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
        <h3 className="text-[20px] font-black mb-6">Data Flow Architecture</h3>

        <div className="space-y-4">
          {/* Student to Staff */}
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2 min-w-[100px]">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">1</div>
              <span className="text-[12px] font-black uppercase tracking-widest">Student</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-blue-400">arrow_forward</span>
                <span className="text-[12px] font-bold text-white/80">Uploads Documents</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Student logs into their dashboard and uploads personal/academic documents. Staff can sync these automatically every 30 seconds or manually via the sync button.
              </p>
            </div>
          </div>

          {/* Staff Processing */}
          <div className="flex items-start gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 min-w-[100px]">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">2</div>
              <span className="text-[12px] font-black uppercase tracking-widest">Staff</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-purple-400">arrow_forward</span>
                <span className="text-[12px] font-bold text-white/80">Reviews & Curates</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Staff reviews documents, updates their status (pending → under_review → approved/rejected), and selects which ones to share with the bank. Can manually upload additional documents if needed.
              </p>
            </div>
          </div>

          {/* Staff to Bank */}
          <div className="flex items-start gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 min-w-[100px]">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold">3</div>
              <span className="text-[12px] font-black uppercase tracking-widest">Bank</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-emerald-400">arrow_forward</span>
                <span className="text-[12px] font-bold text-white/80">Receives & Processes</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Staff shares selected documents with the bank via a secure link with expiry date. Bank accesses only what was shared, reviews for loan processing, and updates application status.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-2xl text-emerald-600">security</span>
            <h4 className="text-[14px] font-black text-emerald-900">Privacy & Security</h4>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 flex-shrink-0">check</span>
              <span>Students only share what they upload</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 flex-shrink-0">check</span>
              <span>Staff curates documents before sharing</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 flex-shrink-0">check</span>
              <span>Bank access is time-limited and controlled</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 flex-shrink-0">check</span>
              <span>Full audit trail of all transfers</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-2xl text-blue-600">speed</span>
            <h4 className="text-[14px] font-black text-blue-900">Efficiency & Speed</h4>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-blue-600 flex-shrink-0">check</span>
              <span>Automated document sync every 30 seconds</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-blue-600 flex-shrink-0">check</span>
              <span>Batch share documents with one click</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-blue-600 flex-shrink-0">check</span>
              <span>Real-time status tracking for all transfers</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-blue-600 flex-shrink-0">check</span>
              <span>No manual email forwarding needed</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
