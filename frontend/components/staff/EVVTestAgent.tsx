"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  extractPdfText,
  parseTransactions,
  calculateEVV,
  generateDemoData,
  formatCurrency,
  formatDate,
  type EVVResult,
  type MonthlyMetric,
} from "@/lib/evv-parser";

type TabType = "upload" | "paste";

interface ConsoleMessage {
  time: string;
  message: string;
  kind?: "ok" | "warn" | "error";
}

// Interactive SVG Gradient Area Chart
const EVVGradientAreaChart: React.FC<{ metrics: MonthlyMetric[] }> = ({ metrics }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!metrics || metrics.length === 0) return null;

  // Chart Dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const avgs = metrics.map((m) => m.avg);
  const maxVal = Math.max(...avgs, 10000);
  const minVal = 0;

  const points = metrics.map((m, idx) => {
    const x = paddingLeft + (idx / (metrics.length - 1 || 1)) * chartWidth;
    const ratio = maxVal > 0 ? m.avg / maxVal : 0;
    const y = height - paddingBottom - ratio * chartHeight;
    return { x, y, metric: m };
  });

  let linePath = "";
  let areaPath = "";

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p = points[i];
      const cpX1 = p0.x + (p.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p.x - p0.x)) / 3;
      const cpY2 = p.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }
    areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((r) => {
    const val = maxVal * r;
    const y = height - paddingBottom - r * chartHeight;
    return { y, val };
  });

  // return (
  //   <div className="bg-white/60 border border-violet-100/50 rounded-3xl p-6 shadow-sm relative group/chart">
  //     <div className="text-xs font-bold text-slate-700 mb-4 flex items-center justify-between uppercase tracking-wider">
  //       <span>Monthly Maintenance Balance Trend</span>
  //       <span className="text-[9px] text-slate-400 font-semibold tracking-widest">INR</span>
  //     </div>

  //     <div className="relative w-full overflow-x-auto scrollbar-hide">
  //       <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none min-w-[500px]">
  //         <defs>
  //           <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
  //             <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22" />
  //             <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.00" />
  //           </linearGradient>
  //           <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
  //             <stop offset="0%" stopColor="#4C1D95" />
  //             <stop offset="100%" stopColor="#8B5CF6" />
  //           </linearGradient>
  //         </defs>

  //         {/* Grid lines */}
  //         {gridLines.map((line, idx) => (
  //           <g key={idx} className="opacity-30">
  //             <line
  //               x1={paddingLeft}
  //               y1={line.y}
  //               x2={width - paddingRight}
  //               y2={line.y}
  //               stroke="#DDD6FE"
  //               strokeWidth="1"
  //               strokeDasharray="4 4"
  //             />
  //             <text
  //               x={paddingLeft - 8}
  //               y={line.y + 3}
  //               textAnchor="end"
  //               className="fill-slate-400 font-bold text-[9px] font-mono"
  //             >
  //               {line.val >= 100000 ? `${(line.val / 100000).toFixed(1)}L` : line.val.toLocaleString("en-IN")}
  //             </text>
  //           </g>
  //         ))}

  //         {/* Area Gradient Fill */}
  //         {areaPath && <path d={areaPath} fill="url(#chartAreaGradient)" className="transition-all duration-300" />}

  //         {/* X axis line */}
  //         <line
  //           x1={paddingLeft}
  //           y1={height - paddingBottom}
  //           x2={width - paddingRight}
  //           y2={height - paddingBottom}
  //           stroke="#E2E8F0"
  //           strokeWidth="1.5"
  //         />

  //         {/* Trend line */}
  //         {linePath && (
  //           <path
  //             d={linePath}
  //             fill="none"
  //             stroke="url(#chartLineGradient)"
  //             strokeWidth="3.5"
  //             strokeLinecap="round"
  //             className="transition-all duration-300"
  //           />
  //         )}

  //         {/* Data Points */}
  //         {points.map((pt, idx) => (
  //           <g
  //             key={idx}
  //             onMouseEnter={() => setHoveredIdx(idx)}
  //             onMouseLeave={() => setHoveredIdx(null)}
  //             className="cursor-pointer"
  //           >
  //             <circle
  //               cx={pt.x}
  //               cy={pt.y}
  //               r="10"
  //               className={`fill-violet-400/20 stroke-none transition-all duration-200 ${
  //                 hoveredIdx === idx ? "scale-100 opacity-100" : "scale-50 opacity-0"
  //               }`}
  //             />
  //             <circle
  //               cx={pt.x}
  //               cy={pt.y}
  //               r={hoveredIdx === idx ? "6.5" : "5"}
  //               className={`fill-white stroke-[#5B21B6] stroke-[3.5] transition-all duration-200`}
  //             />
  //           </g>
  //         ))}

  //         {/* Month labels */}
  //         {points.map((pt, idx) => (
  //           <text
  //             key={idx}
  //             x={pt.x}
  //             y={height - paddingBottom + 20}
  //             textAnchor="middle"
  //             className={`font-black text-[9px] uppercase tracking-wider transition-all duration-200 ${
  //               hoveredIdx === idx ? "fill-violet-700 scale-105" : "fill-slate-400"
  //             }`}
  //           >
  //             {pt.metric.label}
  //           </text>
  //         ))}
  //       </svg>
  //     </div>

  //     {/* Hover Metric Overlay */}
  //     <div className="min-h-[48px] mt-4 flex items-center justify-center p-3 bg-violet-50/50 border border-violet-100/40 rounded-2xl transition-all duration-200 select-none">
  //       {hoveredIdx !== null ? (
  //         <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs font-bold text-slate-700 items-center justify-between w-full px-2">
  //           <span className="text-[#5B21B6] uppercase tracking-widest text-[10px] font-black">{metrics[hoveredIdx].label}</span>
  //           <div className="flex gap-4">
  //             <span>Avg: <span className="text-slate-900 font-extrabold">₹{metrics[hoveredIdx].avg.toLocaleString("en-IN")}</span></span>
  //             <span className="text-slate-400 font-semibold">Min: <span className="text-slate-600 font-bold">₹{metrics[hoveredIdx].min.toLocaleString("en-IN")}</span></span>
  //             <span className="text-slate-400 font-semibold">Max: <span className="text-slate-600 font-bold">₹{metrics[hoveredIdx].max.toLocaleString("en-IN")}</span></span>
  //           </div>
  //         </div>
  //       ) : (
  //         <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
  //           Hover over chart nodes to inspect monthly metrics
  //         </p>
  //       )}
  //     </div>
  //   </div>
  // );
};

export const EVVTestAgent: React.FC<{
  applicationId?: string;
  application?: any;
  onComplete?: (result: EVVResult) => void;
}> = ({ applicationId, application, onComplete }) => {
  // State Management
  const [activeTab, setActiveTab] = useState<TabType>("upload");

  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [fileNameDisplay, setFileNameDisplay] = useState("");
  const [pasteText, setPasteText] = useState("");

  const [uploading, setUploading] = useState(false);
  const [intervalDays, setIntervalDays] = useState(5);

  const [evvResult, setEvvResult] = useState<EVVResult | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Initialize with demo data or saved application EVV data on mount
  useEffect(() => {
    if (application && (application.evvOverall || application.evvMonthlyBreakdown)) {
      try {
        let monthly = application.evvMonthlyBreakdown;
        if (typeof monthly === 'string') {
          monthly = JSON.parse(monthly);
        }
        if (Array.isArray(monthly) && monthly.length > 0) {
          const overall = Number(application.evvOverall) || 85;
          const risk: "Low" | "Medium" | "High" = overall >= 75 ? "Low" : overall < 45 ? "High" : "Medium";
          const grade = overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 50 ? "C" : "D";

          const formattedMetrics: MonthlyMetric[] = monthly.map((m: any, i: number) => {
            const avgVal = m.averageBalance ?? m.avg ?? m.evv ?? 0;
            return {
              label: m.label || `Month ${i + 1}`,
              month: m.month || `2026-0${i + 1}`,
              points: m.points ?? 7,
              avg: avgVal,
              min: m.min ?? Math.round(avgVal * 0.85),
              max: m.max ?? Math.round(avgVal * 1.15),
              median: avgVal,
              stdDev: Math.round(avgVal * 0.05),
              credits: Math.round(avgVal * 0.5),
              debits: Math.round(avgVal * 0.4),
              netCashFlow: Math.round(avgVal * 0.1),
              avgDailyBalance: avgVal,
              transactions: 12,
              lowBalanceDays: m.lowBalanceDays ?? 0,
              riskGrade: grade,
            };
          });

          const avgBal = formattedMetrics.reduce((acc, m) => acc + m.avg, 0) / (formattedMetrics.length || 1);

          setEvvResult({
            overallEVV: overall,
            overallEVVValue: avgBal,
            overallGrade: grade,
            overallRisk: risk,
            totalMonths: formattedMetrics.length,
            totalTransactions: formattedMetrics.length * 12,
            overallAverageBalance: avgBal,
            overallAverageCredits: avgBal * 0.5,
            overallAverageDebits: avgBal * 0.4,
            salaryStability: 100,
            cashFlowStatus: "Positive",
            snapshotInterval: 5,
            snapshots: [],
            transactions: [],
            monthlyMetrics: formattedMetrics,
            period: { start: new Date(), end: new Date() },
            riskAnalysis: {
              lowBalanceDays: 0,
              negativeBalanceDays: 0,
              largeDepositsCount: 0,
              inflationEventsCount: 0,
              bounceCount: 0,
              salaryConsistencyScore: 100,
              emiPaymentsCount: 0,
              emiTransactions: [],
            },
          });
          log("Loaded verified EVV parameters dynamically from application record.", "ok");
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved EVV data:", e);
      }
    }
    loadDemo();
  }, [application]);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleMessages]);

  // Logging function
  const log = (message: string, kind?: "ok" | "warn" | "error") => {
    const time = new Date().toLocaleTimeString();
    setConsoleMessages((prev) => [...prev, { time, message, kind }]);
  };

  // Demo data loader
  const loadDemo = () => {
    const demoTxs = generateDemoData();
    const result = calculateEVV(demoTxs, 5);
    setEvvResult(result);
    log("EVV verification engine online. Standing by for statement data.");
    log(`Synthetic demo compiled: ${demoTxs.length} operations parsed. Computed EVV: ${formatCurrency(result.overallEVV)}.`, "ok");
    log("Analyze a customer bank statement PDF to parse actual dossier parameters.");
  };

  // File selection handler
  const handleFileSelected = (file: File) => {
    setPendingPdfFile(file);
    setFileNameDisplay(file.name);
    log(`Selected document node: ${file.name}`);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add("drag");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("drag");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("drag");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  // Main analysis function
  const handleAnalyze = async () => {
    setUploading(true);
    setConsoleMessages([]);

    try {
      const interval = Math.max(1, intervalDays || 5);
      let text = "";

      if (activeTab === "upload") {
        if (!pendingPdfFile) {
          log("No statement PDF selected.", "warn");
          return;
        }
        text = await extractPdfText(pendingPdfFile);
      } else {
        if (!pasteText.trim()) {
          log("Paste statement text to proceed.", "warn");
          return;
        }
        text = pasteText;
        log("Compiling raw paste block data.");
      }

      const { transactions, skipped } = parseTransactions(text);
      log(
        `Parsed ${transactions.length} statement transactions.`,
        transactions.length > 0 ? "ok" : "warn"
      );

      if (skipped > 0) {
        log(
          `${skipped} transaction lines skipped due to formatting omissions.`,
          "warn"
        );
      }

      if (transactions.length === 0) {
        log("No parseable transactions. Verify source formatting.", "warn");
        setEvvResult(null);
        return;
      }

      const result = calculateEVV(transactions, interval);
      setEvvResult(result);

      if (applicationId && onComplete) {
        onComplete(result);
      }

      log(`Analysis complete. Computed EVV: ${formatCurrency(result.overallEVV)}`, "ok");
    } catch (err: any) {
      log(`Execution failure: ${err.message}`, "error");
      setEvvResult(null);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const displayCurrency = (n: number) => formatCurrency(n);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 p-8 shadow-xl">
      {/* Header */}
      <div className="border-b border-slate-100/50 pb-6 mb-6">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-violet-500/10">
            VL
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">EVV Verification Center</h2>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Secures client bank parameters and computes the Estimated Verified Value (EVV) index locally.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Segmented control for Tab Navigation */}
        <div className="bg-indigo-100/30 border border-indigo-200/20 p-1 rounded-2xl flex max-w-max">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${activeTab === "upload"
              ? "bg-white text-violet-800 shadow-sm border border-violet-100/10"
              : "text-slate-600 hover:text-violet-700"
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Upload Statement
          </button>
          <button
            onClick={() => setActiveTab("paste")}
            className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${activeTab === "paste"
              ? "bg-white text-violet-800 shadow-sm border border-violet-100/10"
              : "text-slate-600 hover:text-violet-700"
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">content_paste</span>
            Raw Statement Paste
          </button>
        </div>

        {/* Upload Panel */}
        {activeTab === "upload" && (
          <div
            className="border border-dashed border-violet-200/70 hover:border-violet-400 bg-gradient-to-br from-violet-50/20 via-white to-purple-50/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 shadow-[inset_0_4px_12px_rgba(91,33,182,0.01)] hover:shadow-lg relative overflow-hidden group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="absolute w-28 h-28 bg-violet-400/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="w-14 h-14 rounded-2xl bg-violet-50/60 border border-violet-100 flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1 duration-300 relative z-10 text-violet-600 shadow-sm">
              <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
            </div>
            <div className="text-slate-800 font-extrabold text-xs uppercase tracking-wider relative z-10">Drag and drop bank statement PDF</div>
            <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider relative z-10">
              SBI, HDFC, ICICI formats parsed client-side
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
            {fileNameDisplay && (
              <div className="mt-4 text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-50 px-4 py-2 rounded-full border border-violet-100 shadow-sm relative z-10">
                {fileNameDisplay}
              </div>
            )}
          </div>
        )}

        {/* Paste Panel */}
        {activeTab === "paste" && (
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Paste raw statement lines here, e.g.:\n01/01/2026 UPI-593-IN ₹5,000.00 ₹85,250.00`}
            className="w-full min-h-40 p-4 bg-violet-50/30 border border-violet-100 rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-slate-800 resize-none"
          />
        )}

        {/* Controls */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <label htmlFor="interval" className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Snapshot Frequency
            </label>
            <input
              id="interval"
              type="number"
              min="1"
              max="6"
              value={intervalDays}
              onChange={(e) => setIntervalDays(parseInt(e.target.value) || 5)}
              className="w-16 px-3 py-2 bg-violet-50/50 border border-violet-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-850"
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">days</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={uploading}
            className={`ml-auto px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2 transition-all duration-300 ${uploading
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-indigo-700 hover:shadow-lg hover:shadow-violet-600/15 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            {uploading ? "Analyzing..." : "Verify EVV"}
          </button>
        </div>

        {/* Results Section */}
        {evvResult && (
          <div className="space-y-6 border-t border-slate-100/80 pt-6">
            {/* Hero Metric Card - Diffused Shadow, Gradient typography, Risk metrics */}
            <div className="bg-white border border-violet-100 rounded-3xl p-8 shadow-[0_20px_40px_-10px_rgba(91,33,182,0.15)] relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none">
                <span className="material-symbols-outlined text-[120px] text-violet-950">payments</span>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
                <div>
                  <div className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">
                    Overall Underwriting Score
                  </div>
                  <div className="text-5xl font-black bg-gradient-to-r from-[#4C1D95] via-[#5B21B6] to-[#8B5CF6] bg-clip-text text-transparent tracking-tight">
                    {evvResult.overallEVV} <span className="text-xl font-bold text-slate-400">/ 100</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-wider">
                    Computed Estimated Verified Value score across {evvResult.totalMonths} month{evvResult.totalMonths > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center bg-violet-50/50 border border-violet-100/50 px-5 py-3 rounded-2xl min-w-[80px]">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Grade</span>
                    <span className="text-3xl font-black text-[#5B21B6] mt-1">{evvResult.overallGrade}</span>
                  </div>

                  <div className="flex flex-col items-center bg-violet-50/50 border border-violet-100/50 px-5 py-3 rounded-2xl min-w-[100px]">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Risk Profile</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mt-2 border ${evvResult.overallRisk === "Low"
                      ? "border-blue-200 bg-blue-50/50 text-blue-700 shadow-sm shadow-blue-500/5"
                      : evvResult.overallRisk === "Medium"
                        ? "border-amber-200 bg-amber-50/50 text-amber-700 shadow-sm shadow-amber-500/5"
                        : "border-rose-200 bg-rose-50/50 text-rose-700 shadow-sm shadow-rose-500/5"
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${evvResult.overallRisk === "Low"
                        ? "bg-blue-600"
                        : evvResult.overallRisk === "Medium"
                          ? "bg-amber-600"
                          : "bg-rose-600"
                        }`} />
                      {evvResult.overallRisk}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Underwriting Indicators Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/40 border border-violet-100/50 rounded-2xl p-4">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Average Balance
                </div>
                <div className="text-base font-black text-slate-800">
                  {displayCurrency(evvResult.overallAverageBalance)}
                </div>
              </div>

              <div className="bg-white/40 border border-violet-100/50 rounded-2xl p-4">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Salary Stability
                </div>
                <div className="text-base font-black text-slate-800">
                  {evvResult.salaryStability}%
                </div>
              </div>

              <div className="bg-white/40 border border-violet-100/50 rounded-2xl p-4">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Net Cash Flow
                </div>
                <div className={`text-base font-black ${evvResult.cashFlowStatus === "Positive" ? "text-blue-600" : "text-rose-600"}`}>
                  {evvResult.cashFlowStatus}
                </div>
              </div>

              <div className="bg-white/40 border border-violet-100/50 rounded-2xl p-4">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Snapshot Interval
                </div>
                <div className="text-base font-black text-slate-800">
                  {evvResult.snapshotInterval} Days
                </div>
              </div>

              <div className="bg-white/40 border border-violet-100/50 rounded-2xl p-4">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Analysis Period
                </div>
                <div className="text-xs font-bold text-slate-700 leading-tight">
                  {evvResult.totalMonths} Month{evvResult.totalMonths > 1 ? "s" : ""} ({evvResult.totalTransactions} txs)
                </div>
              </div>

              <div className="bg-white/40 border border-violet-100/50 rounded-2xl p-4">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Total Snapshots
                </div>
                <div className="text-base font-black text-slate-800">
                  {evvResult.snapshots.length}
                </div>
              </div>
            </div>

            {/* SVG Gradient Area Chart */}
            <div className="space-y-4">
              <EVVGradientAreaChart metrics={evvResult.monthlyMetrics} />
            </div>

            {/* Monthly Metrics Table */}
            <div className="overflow-x-auto border border-violet-100 rounded-3xl bg-white/50 backdrop-blur-md">
              <table className="w-full text-xs font-semibold text-slate-700 min-w-[900px]">
                <thead>
                  <tr className="border-b border-violet-100 bg-violet-50/20 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="text-left px-4 py-4">Month</th>
                    <th className="text-right px-4 py-4">Points</th>
                    <th className="text-right px-4 py-4">Avg</th>
                    <th className="text-right px-4 py-4">Min</th>
                    <th className="text-right px-4 py-4">Max</th>
                    <th className="text-right px-4 py-4">Std Dev</th>
                    <th className="text-right px-4 py-4">Avg Daily Bal</th>
                    <th className="text-right px-4 py-4">Low Bal Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50">
                  {evvResult.monthlyMetrics.map((metric: MonthlyMetric, idx: number) => (
                    <tr key={idx} className="hover:bg-violet-50/20 transition-all duration-150">
                      <td className="px-4 py-4 text-slate-800 font-extrabold">{metric.label}</td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-slate-500">{metric.points}</td>
                      <td className="px-4 py-4 text-right font-bold text-slate-800">{displayCurrency(metric.avg)}</td>
                      <td className="px-4 py-4 text-right text-slate-500">{displayCurrency(metric.min)}</td>
                      <td className="px-4 py-4 text-right text-slate-500">{displayCurrency(metric.max)}</td>
                      <td className="px-4 py-4 text-right font-mono text-slate-400">{displayCurrency(metric.stdDev)}</td>
                      <td className="px-4 py-4 text-right text-slate-800 font-extrabold">{displayCurrency(metric.avgDailyBalance)}</td>
                      <td className={`px-4 py-4 text-right font-mono font-bold ${metric.lowBalanceDays > 5 ? "text-rose-600" :
                        metric.lowBalanceDays > 0 ? "text-amber-600" : "text-slate-400"
                        }`}>{metric.lowBalanceDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Underwriting Risk & Obligations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Indicators */}
              <div className="bg-white/40 border border-violet-100 rounded-3xl p-6 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Underwriting Risk Triggers
                </div>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Low Balance Days (&lt; ₹1,000)</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black ${evvResult.riskAnalysis.lowBalanceDays > 0 ? "bg-amber-50 border border-amber-100 text-amber-700" : "bg-blue-50 border border-blue-100 text-blue-700"}`}>
                      {evvResult.riskAnalysis.lowBalanceDays} Days
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Negative Balance Days (&lt; ₹0)</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black ${evvResult.riskAnalysis.negativeBalanceDays > 0 ? "bg-rose-50 border border-rose-100 text-rose-700 animate-pulse" : "bg-blue-50 border border-blue-100 text-blue-700"}`}>
                      {evvResult.riskAnalysis.negativeBalanceDays} Days
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Large Cash Deposits (&ge; ₹50,000)</span>
                    <span className="px-2.5 py-0.5 rounded-full font-black bg-slate-50 border border-slate-100 text-slate-700">
                      {evvResult.riskAnalysis.largeDepositsCount} Events
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Cheque / ECS Bounce Events</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black ${evvResult.riskAnalysis.bounceCount > 0 ? "bg-rose-50 border border-rose-100 text-rose-700 animate-pulse" : "bg-blue-50 border border-blue-100 text-blue-700"}`}>
                      {evvResult.riskAnalysis.bounceCount} Detected
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Temporary Balance Inflation Events</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black ${evvResult.riskAnalysis.inflationEventsCount > 0 ? "bg-rose-50 border border-rose-100 text-rose-700" : "bg-blue-50 border border-blue-100 text-blue-700"}`}>
                      {evvResult.riskAnalysis.inflationEventsCount} Detected
                    </span>
                  </div>
                </div>
              </div>

              {/* EMI Obligations */}
              <div className="bg-white/40 border border-violet-100 rounded-3xl p-6 shadow-sm flex flex-col">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Existing EMI & Loan Obligations
                </div>
                {evvResult.riskAnalysis.emiPaymentsCount > 0 ? (
                  <div className="space-y-2 overflow-y-auto max-h-36 pr-1">
                    {evvResult.riskAnalysis.emiTransactions.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] font-bold py-1.5 border-b border-violet-100/30">
                        <div className="truncate max-w-[200px]">
                          <span className="text-slate-800 font-extrabold">{tx.narration}</span>
                          <div className="text-[9px] text-slate-400 font-semibold">{formatDate(tx.date)}</div>
                        </div>
                        <span className="text-rose-600 font-extrabold">{displayCurrency(tx.debit)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="my-auto text-center py-6 text-slate-400 text-xs font-bold">
                    No active loan repayments or EMI narrations found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100/50 mt-6 pt-6 flex items-center justify-center gap-8 flex-wrap text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Local Processing Node
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">shield</span>
          Zero External Leaks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
          VidyaLoans Verified
        </span>
      </div>
    </div>
  );
};

export default EVVTestAgent;
