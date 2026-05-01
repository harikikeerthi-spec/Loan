"use client";
import { useEffect, useState } from "react";

interface FlowStep {
  stage: 'student' | 'staff' | 'bank';
  label: string;
  icon: string;
  color: string;
  documentCount: number;
  status: 'pending' | 'active' | 'completed';
  details?: string;
}

interface DocumentFlowTrackerProps {
  studentDocCount: number;
  staffDocCount: number;
  bankDocCount: number;
  lastActivity?: Date;
  sharedCount?: number;
}

export default function DocumentFlowTracker({
  studentDocCount,
  staffDocCount,
  bankDocCount,
  lastActivity,
  sharedCount = 0
}: DocumentFlowTrackerProps) {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  useEffect(() => {
    setSteps([
      {
        stage: 'student',
        label: 'Student',
        icon: 'school',
        color: 'from-blue-500 to-blue-600',
        documentCount: studentDocCount,
        status: studentDocCount > 0 ? 'completed' : 'pending',
        details: `${studentDocCount} document${studentDocCount !== 1 ? 's' : ''} uploaded`
      },
      {
        stage: 'staff',
        label: 'Staff Hub',
        icon: 'admin_panel_settings',
        color: 'from-purple-500 to-purple-600',
        documentCount: staffDocCount,
        status: studentDocCount > 0 ? (staffDocCount > 0 ? 'active' : 'pending') : 'pending',
        details: `${staffDocCount} document${staffDocCount !== 1 ? 's' : ''} received`
      },
      {
        stage: 'bank',
        label: 'Bank',
        icon: 'business',
        color: 'from-emerald-500 to-emerald-600',
        documentCount: bankDocCount,
        status: sharedCount > 0 ? 'completed' : (staffDocCount > 0 ? 'pending' : 'pending'),
        details: `${sharedCount} share${sharedCount !== 1 ? 's' : ''} sent`
      }
    ]);
  }, [studentDocCount, staffDocCount, bankDocCount, sharedCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTrigger(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full -ml-48 -mb-48" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-[20px] font-black text-white mb-2">Document Flow Pipeline</h3>
          <p className="text-[12px] text-white/60 font-bold uppercase tracking-widest">
            Real-time transfer tracking across portals
          </p>
        </div>

        {/* Flow visualization */}
        <div className="flex items-center justify-between gap-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.stage} className="flex-1 flex flex-col items-center gap-3">
              {/* Stage Card */}
              <div className={`relative w-full p-4 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
                step.status === 'active' ? `bg-gradient-to-br ${step.color} shadow-2xl scale-105` :
                step.status === 'completed' ? 'bg-white/10 border border-white/20' :
                'bg-white/5 border border-white/10'
              }`}>
                {/* Pulse animation for active stage */}
                {step.status === 'active' && (
                  <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all ${
                    step.status === 'active' ? 'bg-white/30 shadow-lg' :
                    step.status === 'completed' ? 'bg-emerald-500/30 border border-emerald-500/50' :
                    'bg-white/10 border border-white/10'
                  }`}>
                    <span className={`material-symbols-outlined text-[24px] ${
                      step.status === 'active' ? 'text-white' :
                      step.status === 'completed' ? 'text-emerald-300' :
                      'text-white/40'
                    }`}>
                      {step.icon}
                    </span>
                  </div>

                  {/* Label */}
                  <p className={`text-[12px] font-black uppercase tracking-widest mb-2 ${
                    step.status === 'active' ? 'text-white' :
                    step.status === 'completed' ? 'text-emerald-300' :
                    'text-white/40'
                  }`}>
                    {step.label}
                  </p>

                  {/* Document count badge */}
                  <div className={`px-3 py-1.5 rounded-full text-[11px] font-black font-mono ${
                    step.documentCount > 0 ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                  }`}>
                    {step.documentCount}
                  </div>

                  {/* Details */}
                  <p className={`text-[10px] mt-2 text-center ${
                    step.status === 'active' ? 'text-white/90' :
                    step.status === 'completed' ? 'text-emerald-200/70' :
                    'text-white/30'
                  }`}>
                    {step.details}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="text-[10px] font-bold uppercase tracking-widest">
                {step.status === 'completed' && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Completed
                  </span>
                )}
                {step.status === 'active' && (
                  <span className="flex items-center gap-1 text-blue-400 animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    In Progress
                  </span>
                )}
                {step.status === 'pending' && (
                  <span className="flex items-center gap-1 text-white/40">
                    <span className="material-symbols-outlined text-[14px]">pending</span>
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Animated flow arrows */}
        <div className="flex items-center justify-between gap-2 mb-8 h-1 -mx-2">
          {[0, 1].map((index) => (
            <div
              key={index}
              className={`flex-1 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full transition-all duration-1000 transform ${
                index === animationTrigger % 2 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-50'
              }`}
            />
          ))}
        </div>

        {/* Stats footer */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Total Documents</p>
            <p className="text-[20px] font-black text-white">{studentDocCount + staffDocCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Shared</p>
            <p className="text-[20px] font-black text-emerald-400">{sharedCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Last Activity</p>
            <p className="text-[12px] font-bold text-white/80">
              {lastActivity ? new Date(lastActivity).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
