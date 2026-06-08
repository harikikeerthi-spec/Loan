"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail?: string;
  recipientName?: string;
}

export default function SendEmailModal({ isOpen, onClose, recipientEmail = "", recipientName = "" }: SendEmailModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync recipientEmail when it changes or when modal opens
  useEffect(() => {
    if (isOpen) {
      setTo(recipientEmail);
      setSubject("");
      setContent("");
      setStatusMsg("");
      setIsSuccess(false);
    }
  }, [isOpen, recipientEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !content.trim()) {
      setStatusMsg("Recipient email, subject, and message content are required.");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setStatusMsg("");
    try {
      const res: any = await adminApi.sendEmail({
        to: to.trim(),
        subject: subject.trim(),
        content: content.trim(),
        isBulk: false
      });

      if (res.success) {
        setIsSuccess(true);
        setStatusMsg("✓ Email sent successfully!");
        
        // Auto close after 1.5 seconds
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setIsSuccess(false);
        setStatusMsg(res.message || "Failed to send email. Please try again.");
      }
    } catch (err: any) {
      console.error("Error sending email:", err);
      setIsSuccess(false);
      setStatusMsg(err.message || "An error occurred while sending the email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-[20px]">mail</span>
            <h2 className="text-[15px] font-black uppercase tracking-wider text-slate-800">
              Send Email {recipientName ? `to ${recipientName}` : ""}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Recipient Field */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                Recipient Email
              </label>
              <input
                type="email"
                placeholder="student@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-800"
              />
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="Regarding your education loan application"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-800"
              />
            </div>

            {/* Message Body Field */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                Message Body
              </label>
              <textarea
                placeholder="Type your message here..."
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-800 min-h-[120px] resize-y"
              />
            </div>

            {/* Status Alert */}
            {statusMsg && (
              <div
                className={`p-3.5 rounded-xl text-[12px] font-bold flex items-start gap-2.5 border ${
                  isSuccess
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-rose-50 border-rose-100 text-rose-800"
                }`}
              >
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                  {isSuccess ? "check_circle" : "error"}
                </span>
                <span>{statusMsg}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-slate-200 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">send</span>
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
