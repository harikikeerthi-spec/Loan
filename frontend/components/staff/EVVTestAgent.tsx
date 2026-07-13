"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  extractPdfText,
  parseTransactions,
  calculateEVV,
  aggregateByMonth,
  generateDemoData,
  formatCurrency,
  formatDate,
  type EVVResult,
  type MonthlyMetric,
} from "@/lib/evv-parser";

type TabType = "upload" | "paste";
type DetailTabType = "results" | "console";

interface ConsoleMessage {
  time: string;
  message: string;
  kind?: "ok" | "warn" | "error";
}

export const EVVTestAgent: React.FC<{
  applicationId?: string;
  onComplete?: (result: EVVResult) => void;
}> = ({ applicationId, onComplete }) => {
  // State Management
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabType>("results");
  
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [fileNameDisplay, setFileNameDisplay] = useState("");
  const [pasteText, setPasteText] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [intervalDays, setIntervalDays] = useState(5);
  
  const [evvResult, setEvvResult] = useState<EVVResult | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Initialize with demo data on mount
  useEffect(() => {
    loadDemo();
  }, []);

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
    log("EVV test agent ready. Waiting for a statement.");
    log(`Demo loaded: ${demoTxs.length} synthetic transactions, EVV ${formatCurrency(result.overallEVV)}.`, "ok");
    log("Upload a real PDF or paste statement text, then click Analyze to replace this with your data.");
  };

  // File selection handler
  const handleFileSelected = (file: File) => {
    setPendingPdfFile(file);
    setFileNameDisplay(file.name);
    log(`Selected file: ${file.name}`);
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
          log("No PDF selected yet.", "warn");
          return;
        }
        text = await extractPdfText(pendingPdfFile);
      } else {
        if (!pasteText.trim()) {
          log("No text pasted. Please paste statement data.", "warn");
          return;
        }
        text = pasteText;
        log("Using pasted statement text.");
      }

      const { transactions, skipped } = parseTransactions(text);
      log(
        `Parsed ${transactions.length} transaction line(s).`,
        transactions.length > 0 ? "ok" : "warn"
      );

      if (skipped > 0) {
        log(
          `${skipped} line(s) matched a date but had no readable amount — skipped.`,
          "warn"
        );
      }

      if (transactions.length === 0) {
        log("Nothing parsed — check the statement format or try Paste data with the raw text.", "warn");
        return;
      }

      const result = calculateEVV(transactions, interval);
      setEvvResult(result);
      
      if (applicationId && onComplete) {
        onComplete(result);
      }

      log(`Analysis complete. Overall EVV: ${formatCurrency(result.overallEVV)}`, "ok");
    } catch (err: any) {
      log(`Error: ${err.message}`, "error");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Format currency for display
  const displayCurrency = (n: number) => formatCurrency(n);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm">
            VL
          </div>
          <h2 className="text-lg font-bold text-slate-900">EVV Test Agent</h2>
        </div>
        <p className="text-sm text-slate-600 mt-3">
          Parses a bank statement and computes the Estimated Verified Value (EVV) — a proxy for average maintained balance. All processing runs locally in your browser.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-3 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${
              activeTab === "upload"
                ? "bg-teal-600 text-white"
                : "border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-300"
            }`}
          >
            <span className="text-base">📤</span>
            Upload PDF
          </button>
          <button
            onClick={() => setActiveTab("paste")}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${
              activeTab === "paste"
                ? "bg-teal-600 text-white"
                : "border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-300"
            }`}
          >
            <span className="text-base">📋</span>
            Paste data
          </button>
        </div>

        {/* Upload Panel */}
        {activeTab === "upload" && (
          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-teal-500 hover:bg-teal-50"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-3">📄</div>
            <div className="text-slate-700 font-semibold">Click to select a bank statement PDF</div>
            <div className="text-sm text-slate-500 mt-2">
              Parsed locally with pdf.js — supports SBI / ICICI / HDFC / Canara layouts
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
              <div className="mt-4 text-sm font-medium text-teal-600">{fileNameDisplay}</div>
            )}
          </div>
        )}

        {/* Paste Panel */}
        {activeTab === "paste" && (
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Paste statement text, e.g.:\n01/01/2026  UPI-XYZ-CR  2,500.00        45,120.50\n03/01/2026  ATM-WDL      3,000.00  42,120.50`}
            className="w-full min-h-40 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        )}

        {/* Controls */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <label htmlFor="interval" className="text-sm font-medium text-slate-700">
              Snapshot interval
            </label>
            <input
              id="interval"
              type="number"
              min="1"
              max="90"
              value={intervalDays}
              onChange={(e) => setIntervalDays(parseInt(e.target.value) || 5)}
              className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-600">days</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={uploading}
            className={`ml-auto px-6 py-2 rounded-full font-semibold text-sm text-white flex items-center gap-2 transition-all ${
              uploading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-600 to-teal-700 hover:shadow-lg hover:scale-105"
            }`}
          >
            <span className="text-base">⚡</span>
            {uploading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Results Section */}
        {evvResult && (
          <div className="space-y-6 border-t border-slate-200 pt-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4 border-t-4 border-t-teal-600">
                <div className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-2">
                  Overall EVV
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {displayCurrency(evvResult.overallEVV)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 border-t-4 border-t-blue-600">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                  Snapshots
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {evvResult.snapshots.length}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 border-t-4 border-t-purple-600">
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">
                  Transactions
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {evvResult.transactions.length}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 border-t-4 border-t-amber-600">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
                  Period
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {formatDate(evvResult.period.start)} →<br />
                  {formatDate(evvResult.period.end)}
                </div>
              </div>
            </div>

            {/* Data Tabs */}
            <div className="border-b border-slate-200">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveDetailTab("results")}
                  className={`px-4 py-3 font-semibold text-sm transition-colors ${
                    activeDetailTab === "results"
                      ? "text-teal-600 border-b-2 border-teal-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monthly Breakdown
                </button>
                <button
                  onClick={() => setActiveDetailTab("console")}
                  className={`px-4 py-3 font-semibold text-sm transition-colors ${
                    activeDetailTab === "console"
                      ? "text-teal-600 border-b-2 border-teal-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Console
                </button>
              </div>
            </div>

            {/* Monthly Metrics Table */}
            {activeDetailTab === "results" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">
                        Month
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase">
                        Points
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase">
                        Avg
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase">
                        Min
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase">
                        Max
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {evvResult.monthlyMetrics.map((metric: MonthlyMetric, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900 font-medium">{metric.label}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{metric.points}</td>
                        <td className="px-4 py-3 text-right text-slate-900 font-semibold">
                          {displayCurrency(metric.avg)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {displayCurrency(metric.min)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {displayCurrency(metric.max)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Console Output */}
            {activeDetailTab === "console" && (
              <div className="bg-slate-900 text-slate-200 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-64">
                {consoleMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`py-1 ${
                      msg.kind === "ok"
                        ? "text-emerald-400"
                        : msg.kind === "warn"
                          ? "text-amber-400"
                          : msg.kind === "error"
                            ? "text-rose-400"
                            : "text-slate-300"
                    }`}
                  >
                    <span className="text-slate-500">[{msg.time}]</span> {msg.message}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Console Preview (always visible) */}
        {!evvResult && (
          <div className="bg-slate-900 text-slate-200 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-40">
            {consoleMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`py-1 ${
                  msg.kind === "ok"
                    ? "text-emerald-400"
                    : msg.kind === "warn"
                      ? "text-amber-400"
                      : msg.kind === "error"
                        ? "text-rose-400"
                        : "text-slate-300"
                }`}
              >
                <span className="text-slate-500">[{msg.time}]</span> {msg.message}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-2xl flex items-center justify-center gap-8 flex-wrap text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-2">
          🔒 Bank-grade privacy
        </span>
        <span className="flex items-center gap-2">
          ✓ No data leaves your device
        </span>
        <span className="flex items-center gap-2">
          🤝 Powered by VidyaLoans
        </span>
      </div>
    </div>
  );
};

export default EVVTestAgent;
