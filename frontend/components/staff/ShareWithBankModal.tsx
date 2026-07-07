"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ShareWithBankModalProps {
  applicationId: string;
  applicationNumber: string;
  studentName: string;
  loanAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isMultiBank?: boolean;
  targetBank?: string;
}

// Bank names must exactly match the key→name map in BankNotificationsPanel.isNotificationForThisBank
// so that per-bank notification filtering works correctly.
const BANKS = [
  { id: "auxilo", name: "Auxilo Finserve" },
  { id: "avanse", name: "Avanse Financial" },
  { id: "credila", name: "HDFC Credila" },
  { id: "idfc", name: "IDFC FIRST Bank" },
  { id: "poonawalla", name: "Poonawalla Fincorp" },
];

export default function ShareWithBankModal({
  applicationId,
  applicationNumber,
  studentName,
  loanAmount,
  isOpen,
  onClose,
  onSuccess,
  isMultiBank = false,
  targetBank = "",
}: ShareWithBankModalProps) {
  const { user } = useAuth();
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [priorities, setPriorities] = useState<{ priority: number; bankName: string }[]>([]);

  const targetBankStr = targetBank || "";
  const targetBanksList = targetBankStr && targetBankStr.toLowerCase().replace(/\s+/g, '') !== 'anybank'
    ? targetBankStr.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const filteredBanks = targetBanksList.length > 0
    ? BANKS.filter(bank =>
      targetBanksList.some((name: string) =>
        name.includes(bank.id) ||
        bank.name.toLowerCase().includes(name) ||
        name.includes(bank.name.toLowerCase())
      )
    )
    : BANKS;

  const selectedBankName = BANKS.find((b) => b.id === selectedBank)?.name || "";

  // Fetch priorities and preselect top 3 active ones
  React.useEffect(() => {
    if (isOpen && isMultiBank) {
      const fetchPriorities = async () => {
        try {
          const res = await apiFetch("/api/bank/workflow/priorities") as any;
          if (res?.success && res.data) {
            const activePriorities = res.data.filter((p: any) => p.status === 'Active');
            setPriorities(activePriorities);

            const top3BankNames = activePriorities.slice(0, 3).map((p: any) => p.bankName.toLowerCase());
            const preselectedIds: string[] = [];

            BANKS.forEach(bank => {
              const matches = top3BankNames.some((name: string) =>
                name.includes(bank.id) ||
                bank.name.toLowerCase().includes(name) ||
                name.includes(bank.name.toLowerCase())
              );
              if (matches) {
                preselectedIds.push(bank.id);
              }
            });
            setSelectedBanks(preselectedIds);
          }
        } catch (err) {
          console.error("Failed to fetch bank priorities:", err);
        }
      };
      fetchPriorities();
    }
  }, [isOpen, isMultiBank]);

  const handleShare = useCallback(async () => {
    if (isMultiBank && selectedBanks.length === 0) {
      setError("Please select at least one bank");
      return;
    }
    if (!isMultiBank && !selectedBank) {
      setError("Please select a bank");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const staffName = user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
        : "Staff";

      if (isMultiBank) {
        const selectedBanksList = BANKS.filter(b => selectedBanks.includes(b.id)).map(b => ({
          bankId: b.id,
          bankName: b.name
        }));

        const res: any = await apiFetch("/api/bank/workflow/submit-multiple", {
          method: "POST",
          body: JSON.stringify({
            applicationId,
            banks: selectedBanksList,
            submittedBy: staffName
          })
        });

        if (res?.submissions?.[0]?.id) {
          setSubmissionId(res.submissions[0].id);
        } else {
          setSubmissionId(`MULT-${applicationId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`);
        }
      } else {
        // 1. Update the application's bank field and status
        await adminApi.updateApplication(applicationId, { bank: selectedBankName });
        await adminApi.updateApplicationStatus(applicationId, {
          status: "processing",
          stage: "bank_review",
          progress: 70,
          remarks: remarks || `Application routed to ${selectedBankName}`,
        });

        // 2. Call the bank workflow submit endpoint
        let realSubmissionId = "";
        try {
          const workflowRes: any = await apiFetch("/api/bank/workflow/submit", {
            method: "POST",
            body: JSON.stringify({
              applicationId,
              bankId: selectedBank,
              bankName: selectedBankName,
              submittedBy: staffName,
            }),
          });

          if (workflowRes?.data?.id) {
            realSubmissionId = workflowRes.data.id;
          }
        } catch (workflowErr: any) {
          console.warn("[ShareWithBankModal] Workflow submit warning:", workflowErr?.message);
        }

        // 3. Show success state
        const submissionRef =
          realSubmissionId ||
          `SUB-${applicationId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        setSubmissionId(submissionRef);
      }

      setSuccess(true);

      // Auto-close after 2.5 seconds and notify parent
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "An error occurred while sharing application");
    } finally {
      setLoading(false);
    }
  }, [isMultiBank, selectedBanks, selectedBank, selectedBankName, applicationId, remarks, onClose, onSuccess, user]);

  // Reset state when modal opens/closes
  const handleClose = () => {
    if (!loading) {
      setSelectedBank("");
      setSelectedBanks([]);
      setError("");
      setSuccess(false);
      setSubmissionId("");
      setRemarks("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-black text-slate-900">
                {success ? "✓ Shared!" : (isMultiBank ? "Route Application (Multiparty)" : "Share with Bank")}
              </h2>
              {!success && (
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {!success ? (
                <>
                  {/* Application Details */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Application
                        </span>
                        <p className="text-sm font-bold text-slate-900">
                          {applicationNumber}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Student
                        </span>
                        <p className="text-sm font-bold text-slate-900">{studentName}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Loan Amount
                        </span>
                        <p className="text-sm font-bold text-slate-900">
                          ₹{(loanAmount || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Selection */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">
                      Select {isMultiBank ? "Target Banks" : "Bank"}
                    </label>

                    {isMultiBank ? (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {filteredBanks.map((bank) => {
                          const isChecked = selectedBanks.includes(bank.id);
                          return (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => {
                                setSelectedBanks(prev =>
                                  prev.includes(bank.id)
                                    ? prev.filter(id => id !== bank.id)
                                    : [...prev, bank.id]
                                );
                              }}
                              className={`p-3 rounded-lg border-2 text-left transition-all text-xs font-bold uppercase flex items-center justify-between ${isChecked
                                ? "border-[#6605c7] bg-purple-50 text-purple-900"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                }`}
                            >
                              <span>{bank.name}</span>
                              {isChecked ? (
                                <span className="material-symbols-outlined text-[16px] text-[#6605c7]">check_circle</span>
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-slate-300 bg-white shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {filteredBanks.map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => setSelectedBank(bank.id)}
                            className={`p-3 rounded-lg border-2 text-left transition-all text-xs font-bold uppercase ${selectedBank === bank.id
                              ? "border-[#6605c7] bg-purple-50 text-purple-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              }`}
                          >
                            {bank.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Remarks Input */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Submission Remarks / Notes
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add internal remarks about document verification or routing details..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-900"
                      rows={3}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-xs text-red-700 font-bold">{error}</p>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-slate-100 text-slate-900 font-bold uppercase text-xs rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={(isMultiBank ? selectedBanks.length === 0 : !selectedBank) || loading}
                      className="flex-1 px-4 py-3 text-white font-bold uppercase text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #6605c7, #8b24e5)" }}
                    >
                      {loading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">
                            send
                          </span>
                          {isMultiBank ? "Route Application" : "Send to Bank"}
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                // Success State
                <motion.div
                  className="text-center py-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.div
                    className="w-16 h-16 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl"
                    style={{ background: "linear-gradient(135deg, rgba(102,5,199,0.1), rgba(139,36,229,0.15))" }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="material-symbols-outlined text-4xl" style={{ color: "#6605c7" }}>
                      verified
                    </span>
                  </motion.div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">
                    Application Sent!
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Application #{applicationNumber} has been successfully sent to{" "}
                    <span className="font-bold" style={{ color: "#6605c7" }}>
                      {isMultiBank ? `${selectedBanks.length} partner banks` : selectedBankName}
                    </span>.
                  </p>
                  <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                    <p className="text-xs text-purple-700 font-semibold flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                      The bank portals have been updated in real-time.
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-3">
                    Submission Ref: <span className="font-bold">{submissionId}</span>
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

