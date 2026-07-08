"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAgent } from "../AgentContext";

interface ChatMessage {
    sender: "agent" | "bot";
    text: string;
    timestamp: string;
}

export default function AgentWhatsAppBot() {
    const { showToast } = useAgent();

    // 15.4 Setup config states
    const [botActive, setBotActive] = useState(true);
    const [mobileNumber, setMobileNumber] = useState("+91 98765 43210");
    const [language, setLanguage] = useState("English");
    const [isEditingMobile, setIsEditingMobile] = useState(false);
    const [tempMobile, setTempMobile] = useState(mobileNumber);

    // 15.3 Interactive Conversation Simulator
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: "bot", text: "Vidyaloans Bot 🤖: Hello Krishna! I am your automated agent assistant. Send 'help' at any time to view all available commands.", timestamp: "10:30 AM" }
    ]);
    const [inputCommand, setInputCommand] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSaveMobile = () => {
        if (!tempMobile.trim()) {
            showToast("Mobile number cannot be empty", "warning");
            return;
        }
        setMobileNumber(tempMobile.trim());
        setIsEditingMobile(false);
        showToast("Linked mobile number updated!", "success");
    };

    const toggleBotStatus = () => {
        setBotActive(!botActive);
        showToast(botActive ? "WhatsApp Bot service disabled." : "WhatsApp Bot service enabled and active!", botActive ? "warning" : "success");
    };

    // Bot Response Handler matching 15.2 and 15.3
    const processCommand = (cmd: string) => {
        const normalized = cmd.trim().toLowerCase();
        let reply = "";

        if (normalized.startsWith("status")) {
            const query = cmd.substring(6).trim();
            if (query.toLowerCase().includes("priya")) {
                reply = `Hi Krishna! 👋\nStudent: Priya Sharma\nStatus: 🟠 Sent to SBI (01-Jun-2026)\nBank Query: ❗ Income Certificate (Due Today!)\nAction: Upload updated doc on portal\n🔗 https://agents.vidyaloans.com/upload/1092`;
            } else {
                reply = `Hi Krishna! 👋\nStudent: ${query || "Asha"}\nStatus: 🟡 Verification Check (05-Jul-2026)\nAction: Standard RM screening pending.`;
            }
        } else if (normalized === "new lead") {
            reply = `Ready to capture a new lead? 📝\nUse the quick submit form here:\n🔗 https://agents.vidyaloans.com/lead-submission`;
        } else if (normalized.startsWith("lead")) {
            const parts = cmd.split(" ");
            const name = parts[1] || "Asha";
            const phone = parts[2] || "9876XXXXXX";
            const college = parts[3] || "IIT";
            const amount = parts[4] || "12L";
            reply = `Lead submitted ✅\nStudent: ${name}\nPhone: ${phone}\nCollege: ${college}\nAmount: ${amount}\nTracking ID: VL-LID-${Math.floor(1000 + Math.random() * 9000)}\nWe have initiated the profile review process!`;
        } else if (normalized === "my leads") {
            reply = `Top 5 Active Leads:\n1. Priya Sharma - Sent to SBI (🟠 Query raised)\n2. Amar Nath - Docs Pending\n3. Suma R. - Submitted to SBI\n4. Kiran T. - Sanctioned ✅\n5. Asha - Under Review`;
        } else if (normalized === "commission") {
            reply = `June Commission Summary:\nGross: ₹72,000\nTDS: ₹7,200\nNet Payable: ₹64,800\nPayout Date: 01-Jul-2026\n📊 Full report: agents.vidyaloans.com/commission`;
        } else if (normalized === "payout") {
            reply = `Last Payout:\nAmount: ₹54,000\nDate: 01-Jun-2026\nStatus: Completed ✅\nReference ID: TXN93740284`;
        } else if (normalized === "tasks") {
            reply = `Today's Overdue Tasks:\n1. Call Priya Sharma regarding Income Certificate\n2. Upload Kiran Rao's BITSAT scorecard\n3. Follow up with SBI RM on Anjali Raju's file`;
        } else if (normalized === "help") {
            reply = `Available Triggers:\n• status [name/phone]\n• new lead\n• lead [name] [phone] [college] [amount]\n• my leads\n• commission\n• payout\n• tasks\n• help`;
        } else {
            reply = `Sorry, I didn't recognize that command. Type 'help' to see the full list of available commands!`;
        }

        return `Vidyaloans Bot 🤖:\n${reply}`;
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputCommand.trim()) return;
        if (!botActive) {
            showToast("Bot is currently disabled. Please enable it to test.", "warning");
            return;
        }

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: ChatMessage = {
            sender: "agent",
            text: inputCommand,
            timestamp: currentTime
        };

        const botReply: ChatMessage = {
            sender: "bot",
            text: processCommand(inputCommand),
            timestamp: currentTime
        };

        setMessages(prev => [...prev, newMsg, botReply]);
        setInputCommand("");
    };

    const quickTriggerCommand = (cmdText: string) => {
        setInputCommand(cmdText);
    };

    // Predefined examples from 15.2
    const commandsList = [
        { cmd: "status [name/phone]", example: "status Priya", response: "→ Status: Sent to SBI (01-Jun)" },
        { cmd: "new lead", example: "new lead", response: "→ Link to quick submit form" },
        { cmd: "lead [name] [phone] [college] [amount]", example: "lead Asha 9876 IIT 12L", response: "→ Lead submitted ✅" },
        { cmd: "my leads", example: "my leads", response: "→ Summary of top 5 active leads" },
        { cmd: "commission", example: "commission", response: "→ June earnings: ₹72,000" },
        { cmd: "payout", example: "payout", response: "→ Last payout ₹54,000 on 01-Jun" },
        { cmd: "tasks", example: "tasks", response: "→ Today's 3 overdue tasks" },
        { cmd: "help", example: "help", response: "→ Full command list" }
    ];

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10 text-left pb-12">
            
            {/* Header banner */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-2xl shadow-[#6605c7]/2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 font-display tracking-tight">WhatsApp Command Bot Hub</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">Module 15 • Access key lead updates, payouts, and commissions instantly via plain text commands</p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Setup & Command Cheat-sheet */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* 15.4 Bot Setup in Portal */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Gateway Integration</span>
                            <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900">WhatsApp Bot Setup</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            
                            {/* Service Status */}
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Service Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${botActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className="text-xs font-black text-gray-900">{botActive ? "Active — Linked" : "Inactive / Suspended"}</span>
                                </div>
                            </div>

                            {/* Linked Mobile */}
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Linked Mobile Number</span>
                                {isEditingMobile ? (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={tempMobile}
                                            onChange={(e) => setTempMobile(e.target.value)}
                                            className="px-3 py-1.5 rounded-xl border border-gray-250 text-xs font-bold text-gray-700 w-full focus:outline-none"
                                        />
                                        <button onClick={handleSaveMobile} className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase">Save</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-700">{mobileNumber}</span>
                                        <button onClick={() => { setTempMobile(mobileNumber); setIsEditingMobile(true); }} className="text-[#6605c7] hover:underline text-[10px] font-bold uppercase tracking-wider">[Change]</button>
                                    </div>
                                )}
                            </div>

                            {/* Language Selector */}
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Interface Language</span>
                                <select 
                                    value={language}
                                    onChange={(e) => { setLanguage(e.target.value); showToast(`Language changed to ${e.target.value}`, "info"); }}
                                    className="px-3 py-2 bg-gray-50 border border-gray-150 rounded-xl text-[10px] font-bold text-gray-600 focus:outline-none"
                                >
                                    <option value="English">English</option>
                                    <option value="Telugu">Telugu</option>
                                    <option value="Hindi">Hindi</option>
                                </select>
                            </div>

                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-50">
                            <button 
                                onClick={toggleBotStatus}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    botActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                            >
                                {botActive ? "Disable Bot Gateway" : "Enable Bot Gateway"}
                            </button>
                        </div>
                    </div>

                    {/* 15.2 Available Commands Cheat Sheet */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Interactive Triggers</span>
                            <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900">Available Bot Commands</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                        <th className="p-4">Command Syntax</th>
                                        <th className="p-4">Example Message</th>
                                        <th className="p-4">Bot Action / Response</th>
                                        <th className="p-4 text-center">Interactive Run</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                    {commandsList.map((c, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-mono text-[#6605c7] text-[11px]">{c.cmd}</td>
                                            <td className="p-4 text-gray-800">{c.example}</td>
                                            <td className="p-4 text-gray-550 font-normal">{c.response}</td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => quickTriggerCommand(c.example)}
                                                    className="px-3 py-1.5 bg-gray-50 border border-gray-150 text-gray-500 hover:text-[#6605c7] hover:bg-[#6605c7]/5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    Insert
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Side: 15.3 Visual Chat Simulator */}
                <div className="lg:col-span-1 flex flex-col">
                    
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 flex flex-col justify-between flex-1 min-h-[580px]">
                        
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block mb-1">Sandbox Terminal</span>
                            <h3 className="text-xl font-black font-display tracking-tight text-gray-900">WhatsApp Simulator</h3>
                            <p className="text-[11px] text-gray-400 mt-1 font-semibold leading-relaxed">
                                Saved Gateway: <strong className="text-gray-600">+91 98XXXXXXXX</strong> (Vidyaloans Agent Bot)
                            </p>
                        </div>

                        {/* Interactive Chat Window */}
                        <div className="bg-gray-50/70 border border-gray-100 rounded-3xl p-4 my-6 flex-1 overflow-y-auto max-h-[360px] space-y-4">
                            {messages.map((msg, i) => {
                                const isAgent = msg.sender === "agent";
                                return (
                                    <div key={i} className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}>
                                        <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-semibold whitespace-pre-line leading-relaxed shadow-sm ${
                                            isAgent 
                                                ? "bg-[#6605c7] text-white rounded-br-none" 
                                                : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                        }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input block */}
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Type bot commands e.g. status Priya..."
                                value={inputCommand}
                                onChange={(e) => setInputCommand(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                            />
                            <button 
                                type="submit"
                                className="p-3 bg-[#6605c7] text-white rounded-xl hover:scale-105 transition-transform flex items-center justify-center shadow-lg shadow-[#6605c7]/15"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                            </button>
                        </form>
                    </div>

                </div>

            </div>
        </div>
    );
}
