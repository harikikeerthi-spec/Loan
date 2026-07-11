"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { bankApi } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface DashboardStats {
  totalApplications: number;
  statusBreakdown: Record<string, number>;
  totalAmount: number;
  averageAmount: number;
}

interface RejectionStats {
  totalRejections: number;
  reasonBreakdown: Record<string, number>;
  rejectionRate: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  totalAmount: number;
}

interface AnalyticsData {
  channelStats: DashboardStats | null;
  rejections: RejectionStats | null;
  pipeline: PipelineStage[];
  agingReport: Record<string, number>;
  slaMetrics: any;
  loading: boolean;
  error: string | null;
}

export default function DynamicBankDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    channelStats: null,
    rejections: null,
    pipeline: [],
    agingReport: {},
    slaMetrics: null,
    loading: true,
    error: null,
  });

  const [activeTab, setActiveTab] = useState<"overview" | "products" | "queries" | "disbursements" | "audit">(
    "overview"
  );

  const [showFileLoggingModal, setShowFileLoggingModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [lanInput, setLanInput] = useState("");
  const [isSubmittingLan, setIsSubmittingLan] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true }));

      const headers = { "x-bank-id": user?.bankId || user?.firstName || "" };

      const [channelRes, rejectionsRes, pipelineRes, agingRes, slaRes] = await Promise.all([
        fetch(`${API_BASE}/api/bank/dashboard/analytics/channel`, { headers }),
        fetch(`${API_BASE}/api/bank/dashboard/analytics/rejections`, { headers }),
        fetch(`${API_BASE}/api/bank/dashboard/analytics/pipeline`, { headers }),
        fetch(`${API_BASE}/api/bank/dashboard/analytics/aging`, { headers }),
        fetch(`${API_BASE}/api/bank/dashboard/analytics/sla`, { headers }),
      ]);

      if (!channelRes.ok || !rejectionsRes.ok || !pipelineRes.ok || !agingRes.ok || !slaRes.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const [channelData, rejectionsData, pipelineData, agingData, slaData] = await Promise.all([
        channelRes.json(),
        rejectionsRes.json(),
        pipelineRes.json(),
        agingRes.json(),
        slaRes.json(),
      ]);

      setAnalytics({
        channelStats: channelData,
        rejections: rejectionsData,
        pipeline: pipelineData,
        agingReport: agingData,
        slaMetrics: slaData,
        loading: false,
        error: null,
      });
    } catch (err) {
      setAnalytics(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        loading: false,
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    icon,
    color = "purple",
    trend,
    delay = 0,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
    trend?: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="glass-card p-6 rounded-2xl border border-white/20 backdrop-blur-lg hover:border-white/40 transition-all group"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          {trend && (
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <span>↑</span> {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <span className={`material-symbols-outlined text-${color}-600`}>{icon}</span>
        </div>
      </div>
    </motion.div>
  );

  // File Logging Modal
  const FileLoggingModal = () => {
    const handleLogFile = async () => {
      if (!selectedFile || !lanInput.trim()) {
        alert("Please enter a valid LAN number.");
        return;
      }
      if (selectedFile.lanNumber) {
        alert("LAN number has already been assigned and cannot be changed.");
        return;
      }

      const lanRegex = /^[a-zA-Z0-9-]+$/;
      if (lanInput.length < 15 || lanInput.length > 20) {
        alert("LAN number must be between 15 and 20 characters long.");
        return;
      }
      if (!lanRegex.test(lanInput)) {
        alert("LAN number can only contain letters, numbers, and hyphens (-).");
        return;
      }

      setIsSubmittingLan(true);
      try {
        await bankApi.logFile(selectedFile.id, { lanNumber: lanInput.trim() });
        alert(`🎉 Success! File logged with LAN: ${lanInput}`);
        setLanInput("");
        setSelectedFile(null);
        setShowFileLoggingModal(false);
        await fetchAnalytics();
      } catch (error: any) {
        alert("Failed to log file: " + (error.message || "Unknown error"));
      } finally {
        setIsSubmittingLan(false);
      }
    };

    return (
      <AnimatePresence>
        {showFileLoggingModal && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Log File & Enter LAN</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Application ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedFile?.id || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    LAN Number
                  </label>
                  <input
                    type="text"
                    minLength={15}
                    maxLength={20}
                    placeholder="e.g., VLAN-2026-001"
                    value={lanInput}
                    onChange={(e) => setLanInput(e.target.value.toUpperCase())}
                    disabled={isSubmittingLan}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-800 font-medium"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      setLanInput("");
                      setShowFileLoggingModal(false);
                    }}
                    disabled={isSubmittingLan}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogFile}
                    disabled={isSubmittingLan || !lanInput.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingLan ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Logging...
                      </>
                    ) : (
                      "Log File"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Overview Tab Content
  const OverviewContent = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Applications"
            value={analytics.channelStats?.totalApplications || 0}
            icon="description"
            color="purple"
            delay={0}
          />
          <StatCard
            title="Total Amount"
            value={`₹${(analytics.channelStats?.totalAmount || 0) / 1000000}M`}
            icon="currency_rupee"
            color="blue"
            delay={0.1}
          />
          <StatCard
            title="Avg. Loan Amount"
            value={`₹${((analytics.channelStats?.averageAmount || 0) / 100000).toFixed(1)}L`}
            icon="trending_up"
            color="green"
            delay={0.2}
          />
          <StatCard
            title="Rejections"
            value={analytics.rejections?.totalRejections || 0}
            icon="close_circle"
            color="red"
            delay={0.3}
          />
        </div>
      </div>

      {/* Pipeline Status */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Application Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {analytics.pipeline.map((stage, idx) => (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-4 rounded-xl border border-white/20 text-center"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{stage.stage}</p>
              <p className="text-2xl font-bold text-gray-900">{stage.count}</p>
              <p className="text-xs text-gray-500 mt-1">₹{(stage.totalAmount / 1000000).toFixed(1)}M</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Aging Report */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">File Aging Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.agingReport).map(([range, count], idx) => (
            <motion.div
              key={range}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-4 rounded-xl border border-white/20 text-center"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{range}</p>
              <p className="text-3xl font-bold text-gray-900">{count}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // Products Tab Content
  const ProductsContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Bank Products</h3>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
          + Add Product
        </button>
      </div>
      {/* Product list will be loaded here */}
      <p className="text-gray-500 italic">Loading product configuration...</p>
    </div>
  );

  // Queries Tab Content
  const QueriesContent = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Query Management</h3>
      {/* Queries will be displayed here */}
      <p className="text-gray-500 italic">Loading queries...</p>
    </div>
  );

  // Disbursements Tab Content
  const DisbursementsContent = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Disbursement Tracking</h3>
      {/* Disbursements will be displayed here */}
      <p className="text-gray-500 italic">Loading disbursement records...</p>
    </div>
  );

  // Audit Tab Content
  const AuditContent = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Audit Logs</h3>
      {/* Audit logs will be displayed here */}
      <p className="text-gray-500 italic">Loading audit trail...</p>
    </div>
  );

  if (analytics.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">Error loading analytics</p>
          <p className="text-gray-600 mb-6">{analytics.error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bank Dashboard</h1>
          <p className="text-gray-600">Real-time application and loan portfolio analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {(["overview", "products", "queries", "disbursements", "audit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium capitalize border-b-2 transition-all ${activeTab === tab
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && <OverviewContent />}
            {activeTab === "products" && <ProductsContent />}
            {activeTab === "queries" && <QueriesContent />}
            {activeTab === "disbursements" && <DisbursementsContent />}
            {activeTab === "audit" && <AuditContent />}
          </motion.div>
        </AnimatePresence>
      </div>

      <FileLoggingModal />
    </div>
  );
}
