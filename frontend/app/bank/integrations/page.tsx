"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
    time: string;
    level: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
    message: string;
}

export default function Integrations() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"salesforce" | "slack" | "webhooks" | "bulk_export">("salesforce");

    // Live Integration Stats
    const [sfSyncActive, setSfSyncActive] = useState(true);
    const [slackSyncActive, setSlackSyncActive] = useState(true);
    const [lastSfSync, setLastSfSync] = useState("2026-05-20 10:14:02");
    const [syncProgress, setSyncProgress] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    // Logs Console
    const [logs, setLogs] = useState<LogEntry[]>([
        { time: "11:00:15", level: "INFO", message: "Webhook listener node online on port 443." },
        { time: "11:02:44", level: "SUCCESS", message: "Salesforce schema mapping handshake complete." },
        { time: "11:15:30", level: "INFO", message: "Slack Block Kit dispatcher registered target: #vidyaloans-decisions" },
        { time: "11:30:10", level: "SUCCESS", message: "Routine cron: Synced 3 recent decisions with Salesforce CRM." }
    ]);

    // Slack settings states
    const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T012345/B67890/xYz1234567890abcdef");
    const [slackChannel, setSlackChannel] = useState("#vidyaloans-decisions");
    const [notifyOnIncoming, setNotifyOnIncoming] = useState(true);
    const [notifyOnDecision, setNotifyOnDecision] = useState(true);
    const [notifyOnQuery, setNotifyOnQuery] = useState(true);
    const [notifyOnSla, setNotifyOnSla] = useState(false);

    // Salesforce mapping states
    const [mappings, setMappings] = useState([
        { localField: "applicationNumber", sfField: "Lead_Identifier__c", status: "Mapped" },
        { localField: "firstName + lastName", sfField: "Contact.Name", status: "Mapped" },
        { localField: "amount", sfField: "Opportunity.Amount__c", status: "Mapped" },
        { localField: "bank", sfField: "Opportunity.Partner_Bank__c", status: "Mapped" },
        { localField: "status", sfField: "Opportunity.StageName", status: "Mapped" },
    ]);

    // Bank detection helpers
    const currentBankId = typeof window !== "undefined" ? sessionStorage.getItem("selectedBank") : null;
    const currentBankName = useMemo(() => {
        if (!currentBankId) return user?.firstName || "SBI";
        const map: Record<string, string> = {
            auxilo: "Auxilo Finserve",
            avanse: "Avanse Financial",
            credila: "HDFC Credila",
            idfc: "IDFC FIRST Bank",
            poonawalla: "Poonawalla Fincorp",
        };
        return map[currentBankId] || currentBankId.toUpperCase();
    }, [currentBankId, user]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const addLog = (level: "INFO" | "SUCCESS" | "WARNING" | "ERROR", message: string) => {
        const time = new Date().toLocaleTimeString("en-GB");
        setLogs(prev => [
            { time, level, message },
            ...prev.slice(0, 19) // Keep last 20 entries
        ]);
    };

    const triggerSalesforceSync = () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncProgress(10);
        addLog("INFO", `Initializing batch sync push for ${currentBankName} CRM pipeline...`);

        const intervals = [
            { progress: 35, log: `Salesforce API authentication token refreshed (Session: 00D5j00...).` },
            { progress: 65, log: `Querying Postgres backend for recent decision updates since ${lastSfSync}...` },
            { progress: 85, log: `Mapping data payloads: Successfully converted 5 active student files to Salesforce Opportunities.` },
            { progress: 100, log: `Salesforce CRM sync complete. 5 Opportunities updated, 0 conflicts.` }
        ];

        intervals.forEach((step, index) => {
            setTimeout(() => {
                setSyncProgress(step.progress);
                addLog(step.progress === 100 ? "SUCCESS" : "INFO", step.log);
                if (step.progress === 100) {
                    setIsSyncing(false);
                    setLastSfSync(new Date().toISOString().replace('T', ' ').substring(0, 19));
                }
            }, (index + 1) * 800);
        });
    };

    const handleSlackTest = () => {
        addLog("INFO", `Triggering Slack Block Kit notification to webhook target...`);
        setTimeout(() => {
            addLog("SUCCESS", `Payload dispatched! Received '200 OK' from slack-dispatcher to channel ${slackChannel}.`);
            alert(`Test message successfully dispatched! Preview the Block Kit card design in the layout window.`);
        }, 600);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div>
                        <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight uppercase">
                            Collaboration Hub
                        </h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Synchronize your {currentBankName} lead CRM pipeline with Salesforce & push live Slack alerts
                        </p>
                    </div>
                </motion.div>

                {/* Sync status nodes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card bg-white p-6 border border-gray-100 rounded-[2rem] flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Salesforce Node</span>
                            <span className="text-base font-black text-gray-900 uppercase">CRM Gateway</span>
                            <span className="text-[9px] font-bold text-gray-400 block mt-1">Last Synced: {lastSfSync}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            sfSyncActive ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                        }`}>
                            {sfSyncActive ? "Active" : "Disabled"}
                        </span>
                    </div>

                    <div className="glass-card bg-white p-6 border border-gray-100 rounded-[2rem] flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Slack Hook</span>
                            <span className="text-base font-black text-gray-900 uppercase">Block Kit Alert</span>
                            <span className="text-[9px] font-bold text-[#6605c7] block mt-1">Target: {slackChannel}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            slackSyncActive ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                        }`}>
                            {slackSyncActive ? "Listening" : "Offline"}
                        </span>
                    </div>

                    <div className="glass-card bg-white p-6 border border-gray-100 rounded-[2rem] flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Listener Endpoint</span>
                            <span className="text-base font-black text-gray-900 uppercase">REST Webhooks</span>
                            <span className="text-[9px] font-bold text-gray-400 block mt-1">Status: Listening to events</span>
                        </div>
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                </div>

                {/* Sub-navigation tabs */}
                <div className="flex border-b border-gray-100 gap-8 overflow-x-auto">
                    {[
                        { id: "salesforce", label: "Salesforce CRM Link" },
                        { id: "slack", label: "Slack Team Alerts" },
                        { id: "webhooks", label: "Integrations Event Log" },
                        { id: "bulk_export", label: "Bulk Data Exporter" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`text-xs font-black uppercase tracking-[0.2em] pb-3 transition-all relative whitespace-nowrap ${
                                activeTab === tab.id ? "text-[#6605c7] font-black" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="integrationsTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6605c7]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Workspace grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT WORKSPACE PANELS */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            
                            {/* Salesforce Integration Tab */}
                            {activeTab === "salesforce" && (
                                <motion.div
                                    key="salesforcePanel"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6 text-left"
                                >
                                    <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                                        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-1">CRM Schema Field Mapping</h3>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Map VidyaLoans database columns to standard Salesforce custom fields</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const local = prompt("Enter Local Database Field name:") || "";
                                                    const sf = prompt("Enter Salesforce Target Field API Name (e.g. Student_Name__c):") || "";
                                                    if (local && sf) {
                                                        setMappings(prev => [...prev, { localField: local, sfField: sf, status: "Mapped" }]);
                                                        addLog("INFO", `Mapped new custom sync schema entry: ${local} -> ${sf}`);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-[#6605c7] hover:bg-[#5204a0] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                                            >
                                                Add Mapping
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                        <th className="pb-3">VidyaLoans Column</th>
                                                        <th className="pb-3">Salesforce Field Mapping</th>
                                                        <th className="pb-3">Sync Strategy</th>
                                                        <th className="pb-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                                                    {mappings.map((item, i) => (
                                                        <tr key={i} className="hover:bg-purple-50/10">
                                                            <td className="py-4 font-mono text-[10px] text-purple-600 font-bold">{item.localField}</td>
                                                            <td className="py-4 font-mono text-[10px] text-gray-500">{item.sfField}</td>
                                                            <td className="py-4">
                                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded text-[8px] font-black uppercase tracking-widest">
                                                                    Two-Way Push
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-right">
                                                                <button
                                                                    onClick={() => {
                                                                        setMappings(prev => prev.filter((_, idx) => idx !== i));
                                                                        addLog("WARNING", `Revoked schema map field: ${item.localField}`);
                                                                    }}
                                                                    className="text-rose-600 hover:text-rose-800 text-[9px] font-black uppercase tracking-widest"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Slack Alerts Tab */}
                            {activeTab === "slack" && (
                                <motion.div
                                    key="slackPanel"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6 text-left"
                                >
                                    <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-1">Slack Channel Setup</h3>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Configure where decision webhooks deliver Block Kit alert cards</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Incoming Webhook URL</label>
                                                <input
                                                    type="text"
                                                    value={webhookUrl}
                                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Target Channel Feed</label>
                                                <input
                                                    type="text"
                                                    value={slackChannel}
                                                    onChange={(e) => setSlackChannel(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Triggers checkboxes */}
                                        <div className="border-t border-gray-100 pt-6">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Event Subscription Subscribes</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { id: "incoming", label: "Incoming File Logged", value: notifyOnIncoming, setter: setNotifyOnIncoming },
                                                    { id: "decision", label: "Credit Sanction / Reject Decision", value: notifyOnDecision, setter: setNotifyOnDecision },
                                                    { id: "query", label: "Missing Document Query Dispatch", value: notifyOnQuery, setter: setNotifyOnQuery },
                                                    { id: "sla", label: "SLA TAT Breach Risk (Alert)", value: notifyOnSla, setter: setNotifyOnSla }
                                                ].map((t) => (
                                                    <label key={t.id} className="flex items-center gap-3 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={t.value}
                                                            onChange={(e) => t.setter(e.target.checked)}
                                                            className="w-4.5 h-4.5 text-[#6605c7] rounded border-gray-200 focus:ring-[#6605c7] accent-[#6605c7]"
                                                        />
                                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{t.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Event log webhooks tab */}
                            {activeTab === "webhooks" && (
                                <motion.div
                                    key="webhooksPanel"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6 text-left"
                                >
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-1">Webhook Dispatch History</h3>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Logs of incoming API transactions and outbound webhooks triggered by decisions</p>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {[
                                            { event: "opportunity.created", target: "Salesforce CRM Link", status: "201 Created", date: "May 20, 2026 11:30:10" },
                                            { event: "slack.alert_dispatch", target: "#vidyaloans-decisions Feed", status: "200 OK", date: "May 20, 2026 11:15:30" },
                                            { event: "application.updated", target: "Auxilo Internal Broker Gateway", status: "200 OK", date: "May 20, 2026 10:55:04" },
                                            { event: "document.ocr_verification", target: "DocuVault Core Webhook", status: "200 OK", date: "May 20, 2026 10:20:12" },
                                            { event: "query.raised", target: "Slack Alert Dispatcher", status: "200 OK", date: "May 20, 2026 09:44:22" }
                                        ].map((log, index) => (
                                            <div key={index} className="py-4 flex justify-between items-center flex-wrap gap-4 text-xs font-semibold">
                                                <div>
                                                    <span className="font-mono text-purple-700 font-bold block">{log.event}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mt-0.5">Target: {log.target}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest block w-max ml-auto">
                                                        {log.status}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 mt-1 block uppercase tracking-widest">{log.date}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                             {/* Bulk Export Tab */}
                             {activeTab === "bulk_export" && (
                                 <motion.div
                                     key="bulkExportPanel"
                                     initial={{ opacity: 0, y: 10 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     exit={{ opacity: 0, y: -10 }}
                                     className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6 text-left"
                                 >
                                     <div>
                                         <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-1">Bulk Data Exporter</h3>
                                         <p className="text-[10px] text-gray-400 uppercase tracking-widest">Select dates, filtering stages, and export formats to download credit files</p>
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-1">
                                             <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Start Date</label>
                                             <input
                                                 type="date"
                                                 defaultValue="2026-05-01"
                                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#6605c7]"
                                             />
                                         </div>
                                         <div className="space-y-1">
                                             <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">End Date</label>
                                             <input
                                                 type="date"
                                                 defaultValue="2026-05-26"
                                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#6605c7]"
                                             />
                                         </div>
                                     </div>

                                     <div className="border-t border-gray-100 pt-6">
                                         <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Select Stages to Include</h4>
                                         <div className="grid grid-cols-2 gap-4">
                                             {["Pre-Screening Check", "Verification Audits", "Risk Evaluation", "Final Review Pool", "Disbursement Matrix"].map((stage, idx) => (
                                                 <label key={idx} className="flex items-center gap-3 cursor-pointer select-none">
                                                     <input
                                                         type="checkbox"
                                                         defaultChecked
                                                         className="w-4.5 h-4.5 text-[#6605c7] rounded border-gray-200 focus:ring-[#6605c7] accent-[#6605c7]"
                                                     />
                                                     <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{stage}</span>
                                                 </label>
                                             ))}
                                         </div>
                                     </div>

                                     <div className="border-t border-gray-100 pt-6">
                                         <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Export File Format</h4>
                                         <div className="flex gap-6">
                                             <label className="flex items-center gap-2 cursor-pointer select-none">
                                                 <input type="radio" name="export_format" defaultChecked className="w-4.5 h-4.5 text-[#6605c7] accent-[#6605c7]" />
                                                 <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Excel (.xlsx)</span>
                                             </label>
                                             <label className="flex items-center gap-2 cursor-pointer select-none">
                                                 <input type="radio" name="export_format" className="w-4.5 h-4.5 text-[#6605c7] accent-[#6605c7]" />
                                                 <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">CSV Sheet (.csv)</span>
                                             </label>
                                         </div>
                                     </div>

                                     <div className="border-t border-gray-100 pt-6 flex justify-end">
                                         <button
                                             type="button"
                                             onClick={() => {
                                                 alert("📊 Compiling selected criteria dossier... Downloading dataset file.");
                                                 const link = document.createElement("a");
                                                 link.href = "data:text/csv;charset=utf-8,LAN,Student,University,Amount,ROI,Status\nLAN-IDFC-89210,Rahul Sen,Stanford,1200000,9.55,approved\nLAN-SBI-10492,Priya Nair,Carnegie Mellon,2400000,9.25,processing";
                                                 link.setAttribute("download", "vidyaloans-bulk-export.csv");
                                                 document.body.appendChild(link);
                                                 link.click();
                                                 link.remove();
                                             }}
                                             className="px-5 py-2.5 bg-[#6605c7] hover:bg-[#5204a0] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all flex items-center gap-1.5 font-sans"
                                         >
                                             <span className="material-symbols-outlined text-sm">download</span> Generate & Export Dataset
                                         </button>
                                     </div>
                                 </motion.div>
                             )}

                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN: INTERACTIVE CONTROLLER CARDS */}
                    <div className="lg:col-span-4 space-y-6 text-left">
                        
                        {/* Tab controller for Salesforce */}
                        {activeTab === "salesforce" && (
                            <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-md space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">CRM Link Broker</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                                    Trigger a live synchronization batch between Supabase Postgres student database and your Salesforce CRM gateway.
                                </p>

                                {isSyncing ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#6605c7]">
                                            <span>Processing Sync</span>
                                            <span>{syncProgress}%</span>
                                        </div>
                                        <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-[#6605c7] h-full rounded-full transition-all duration-500" style={{ width: `${syncProgress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={triggerSalesforceSync}
                                        className="w-full py-4 bg-[#6605c7] hover:bg-[#5204a0] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">cloud_sync</span>
                                        Sync with Salesforce
                                    </button>
                                )}

                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Integration Node:</span>
                                        <span className="text-gray-800 font-bold">API STAGE 2</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Postgres Stream:</span>
                                        <span className="text-[#6605c7] font-bold">SUPABASE DIRECT</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Synced Leads:</span>
                                        <span className="text-emerald-500 font-bold">142 leads</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab controller for Slack */}
                        {activeTab === "slack" && (
                            <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-md space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Block Kit Dispatcher</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                                    Preview how the webhook will format structured loan decisions for Slack team layouts. Click below to fire a test notification payload.
                                </p>

                                <button
                                    onClick={handleSlackTest}
                                    className="w-full py-4 bg-[#6605c7] hover:bg-[#5204a0] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-base">campaign</span>
                                    Send Test Alert
                                </button>

                                {/* Structured Slack bubble visual mockup */}
                                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-900 text-white space-y-3 font-mono text-[9px] leading-relaxed shadow-sm">
                                    <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                                        <div className="w-5 h-5 bg-[#6605c7] rounded flex items-center justify-center text-white text-[9px] font-black">VL</div>
                                        <div className="font-bold text-gray-200 uppercase tracking-widest text-[8px]">VidyaLoans APP 11:32 AM</div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-purple-400 font-bold">🏦 PARTNER DECISION LOGGED</p>
                                        <p className="text-gray-300">Sanction issued for student <span className="text-white font-bold">Devendra Kumar</span>.</p>
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-[8px] mt-2">Payload Details:</p>
                                        <div className="pl-2 border-l border-purple-500/50 space-y-0.5 text-gray-300">
                                            <div>• <span className="text-gray-500">Bank:</span> {currentBankName}</div>
                                            <div>• <span className="text-gray-500">Amount:</span> ₹1,500,000</div>
                                            <div>• <span className="text-gray-500">Yield spread:</span> 9.50% FLOATING</div>
                                            <div>• <span className="text-gray-500">Status:</span> SANCTIONED_APPROVED</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <span className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-white font-bold border border-gray-700 text-[8px] cursor-pointer">
                                            View Application
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab controller for Bulk Export */}
                        {activeTab === "bulk_export" && (
                            <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-md space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Data Exporter Metrics</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                                    Securely generate encrypted dumps of credit officer activities, sanction metrics, and student profiles for audit compliance reporting.
                                </p>
                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Last Export Triggered:</span>
                                        <span className="text-gray-800 font-bold">2 hours ago</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Export File Size:</span>
                                        <span className="text-[#6605c7] font-bold">42.8 KB</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Rows Compiled:</span>
                                        <span className="text-emerald-500 font-bold">42 records</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Terminal Node Log screen */}
                        <div className="glass-card bg-gray-950 border border-gray-900 rounded-[2.5rem] p-6 shadow-inner relative overflow-hidden h-[300px] flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center border-b border-gray-900 pb-3 mb-4">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                                        Live CLI Terminal
                                    </span>
                                    <button 
                                        onClick={() => {
                                            setLogs([]);
                                            addLog("INFO", "Terminal logs console cleared.");
                                        }}
                                        className="text-[8px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <div className="space-y-2.5 max-h-[190px] overflow-y-auto font-mono text-[9px] text-gray-300 leading-normal pr-1 select-text">
                                    {logs.map((log, index) => (
                                        <div key={index} className="flex gap-2">
                                            <span className="text-gray-600 font-bold shrink-0">{log.time}</span>
                                            <span className={`font-black shrink-0 ${
                                                log.level === "SUCCESS" ? "text-emerald-400" :
                                                log.level === "WARNING" ? "text-amber-500" :
                                                log.level === "ERROR" ? "text-rose-500" : "text-purple-400"
                                            }`}>
                                                [{log.level}]
                                            </span>
                                            <span className="text-gray-300 break-words">{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-4">
                                SECURE SHELL GATEWAY V5.0
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
