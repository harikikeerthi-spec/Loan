"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    sender: "banker" | "staff";
    senderName: string;
    text: string;
    time: string;
}

export default function CommunicationHub() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // Channels list
    const [activeChannel, setActiveChannel] = useState("ramesh");
    const [channels, setChannels] = useState([
        { id: "ramesh", name: "Ramesh Kumar", title: "Senior Supervisor", avatar: "RK", status: "online", lastMsg: "Yes, I am reviewing the documents..." },
        { id: "credit", name: "Credit Approvals Desk", title: "Underwriter Queue", avatar: "CA", status: "idle", lastMsg: "Underwriter assigned to HDFC pipeline." },
        { id: "escalations", name: "VidyaLoans Admin Support", title: "Escalation Desk", avatar: "VL", status: "offline", lastMsg: "Ticket #891 successfully resolved." }
    ]);

    // Chat History states
    const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({
        ramesh: [
            { id: "1", sender: "staff", senderName: "Ramesh Kumar", text: "Hi! Welcome to the VidyaLoans Staff Desk. How can I help you today with your active applications?", time: "10:15 AM" },
            { id: "2", sender: "banker", senderName: "Bank Officer", text: "Hello Ramesh, we have logged a Bank LAN for student Devendra Kumar and uploaded the pricing structures. Can you verify the academic checklist?", time: "10:20 AM" },
            { id: "3", sender: "staff", senderName: "Ramesh Kumar", text: "Checking now. The OCR extraction match looks solid (98%) on both the 10th and 12th marksheets. The board names are correct. I am syncing these updates to the ledger.", time: "10:22 AM" }
        ],
        credit: [
            { id: "c1", sender: "staff", senderName: "Credit Desk", text: "Welcome to the Underwriting Hotline. Please mention the student LAN for credit overrides.", time: "09:00 AM" }
        ],
        escalations: [
            { id: "e1", sender: "staff", senderName: "System Node", text: "No active escalations for your branch node at this moment.", time: "Yesterday" }
        ]
    });

    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Scroll to bottom whenever history changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, activeChannel, isTyping]);

    const activeMessages = useMemo(() => {
        return chatHistory[activeChannel] || [];
    }, [chatHistory, activeChannel]);

    const handleSendMessage = (textToSend: string) => {
        if (!textToSend.trim()) return;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: Message = {
            id: Date.now().toString(),
            sender: "banker",
            senderName: `${currentBankName} Officer`,
            text: textToSend,
            time: timestamp
        };

        // Append to chat
        setChatHistory(prev => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), newMsg]
        }));
        setInputText("");

        // Trigger simulated typist response
        if (activeChannel === "ramesh") {
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                let replyText = "Received! Let me log this remark onto our system and synchronise with the database.";
                const lowerText = textToSend.toLowerCase();
                
                if (lowerText.includes("clarification") || lowerText.includes("document") || lowerText.includes("query")) {
                    replyText = "Understood. I will immediately notify the student via WhatsApp and email to upload the missing or corrected documents.";
                } else if (lowerText.includes("sla") || lowerText.includes("tat") || lowerText.includes("breach") || lowerText.includes("delayed")) {
                    replyText = "Apologies for the delay! I'm escalating this application to our senior credit underwriter right now for priority resolution today.";
                } else if (lowerText.includes("fast") || lowerText.includes("urgent") || lowerText.includes("approve")) {
                    replyText = "Initiating fast-track override protocol. I will verify the collateral assets myself and sign-off on the checklist within an hour.";
                }

                const staffReply: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: "staff",
                    senderName: "Ramesh Kumar",
                    text: replyText,
                    time: replyTime
                };

                setChatHistory(prev => ({
                    ...prev,
                    ramesh: [...(prev.ramesh || []), staffReply]
                }));

                // Update channel last message
                setChannels(prev => prev.map(ch => {
                    if (ch.id === "ramesh") {
                        return { ...ch, lastMsg: replyText };
                    }
                    return ch;
                }));

            }, 1200);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-[#6605c7] bg-purple-50 p-2 rounded-xl">forum</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Hotline Intercom</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight italic uppercase">
                            Staff Desk Chat
                        </h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Direct message hotline to VidyaLoans supervisor desks for {currentBankName}
                        </p>
                    </div>
                </motion.div>

                {/* Chat Panel Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-[600px]">
                    
                    {/* Left Panel: Channels list */}
                    <div className="lg:col-span-4 bg-white/80 border border-gray-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col gap-6">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-1">Active Hotline Nodes</h3>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Select a desk supervisor to start a live query query</p>
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                            {channels.map((ch) => {
                                const isActive = activeChannel === ch.id;
                                return (
                                    <div
                                        key={ch.id}
                                        onClick={() => {
                                            setActiveChannel(ch.id);
                                            setIsTyping(false);
                                        }}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 text-left ${
                                            isActive 
                                            ? "bg-[#6605c7]/5 border-[#6605c7]/20 shadow-sm" 
                                            : "bg-white border-gray-100 hover:border-purple-200"
                                        }`}
                                    >
                                        <div className="relative">
                                            <div 
                                                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white italic text-[11px]"
                                                style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)' }}
                                            >
                                                {ch.avatar}
                                            </div>
                                            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                                                ch.status === "online" ? "bg-emerald-500 animate-pulse" :
                                                ch.status === "idle" ? "bg-amber-500" : "bg-gray-400"
                                            }`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-xs font-black uppercase italic tracking-tight text-gray-900 truncate">
                                                    {ch.name}
                                                </h4>
                                            </div>
                                            <p className="text-[8px] font-bold text-purple-600 uppercase tracking-widest mt-0.5">{ch.title}</p>
                                            <p className="text-[10px] text-gray-400 truncate mt-1">{ch.lastMsg}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Panel: Conversation Panel */}
                    <div className="lg:col-span-8 bg-white border border-[#6605c7]/5 rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col justify-between">
                        
                        {/* Conversation Header */}
                        <div className="p-6 border-b border-gray-100 bg-[#6605c7]/[0.01] flex justify-between items-center">
                            <div className="flex items-center gap-4 text-left">
                                <div 
                                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white italic text-[11px]"
                                    style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)' }}
                                >
                                    {channels.find(c => c.id === activeChannel)?.avatar}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase italic tracking-tight text-gray-900">
                                        {channels.find(c => c.id === activeChannel)?.name}
                                    </h4>
                                    <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Interactive Secure Connection Active
                                    </p>
                                </div>
                            </div>

                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                Hotline SSL-5
                            </span>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/20 space-y-4 max-h-[380px]">
                            {activeMessages.map((msg) => {
                                const isBanker = msg.sender === "banker";
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex flex-col ${isBanker ? "items-end" : "items-start"}`}
                                    >
                                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                            {msg.senderName} • {msg.time}
                                        </span>
                                        <div 
                                            className={`p-4 rounded-[1.5rem] text-xs font-semibold max-w-[80%] text-left ${
                                                isBanker 
                                                ? "text-white rounded-tr-none" 
                                                : "text-gray-900 rounded-tl-none border border-gray-100 shadow-sm"
                                            }`}
                                            style={isBanker ? {
                                                background: 'linear-gradient(135deg, #6605c7, #8b24e5)'
                                            } : {
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                            }}
                                        >
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex flex-col items-start">
                                    <span className="text-[7px] font-black uppercase tracking-widest text-purple-500 mb-1 animate-pulse">
                                        Ramesh Kumar is drafting response...
                                    </span>
                                    <div className="bg-white border border-gray-100 p-4 rounded-[1.5rem] rounded-tl-none flex gap-1.5 items-center shadow-sm">
                                        <span className="w-2 h-2 bg-[#6605c7] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-[#6605c7] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-[#6605c7] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions & Input Controls */}
                        <div className="p-6 border-t border-gray-100 bg-white space-y-4">
                            
                            {/* Banker Preset Quick Actions */}
                            {activeChannel === "ramesh" && (
                                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                                    {[
                                        { label: "Clarify Document Query", text: "Hello Ramesh, regarding the query raised on student marksheets, can you verify what clarification is required?" },
                                        { label: "Inquire about SLA TAT Delay", text: "Hi Ramesh, this application has been pending in active review for 6 days. Can we check the delay?" },
                                        { label: "Request Fast-Track Approval", text: "Hello, we need an urgent credit sign-off for this scholar application. Can we fast-track approval?" }
                                    ].map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendMessage(action.text)}
                                            className="px-3.5 py-2 bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#6605c7] hover:text-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm transition-all shrink-0"
                                        >
                                            ⚡ {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* TextInput form */}
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage(inputText);
                                }}
                                className="flex gap-3"
                            >
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type message directly to supervisor..."
                                    className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                                />
                                <button
                                    type="submit"
                                    className="px-6 bg-[#6605c7] hover:bg-[#5204a0] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5"
                                >
                                    Send
                                    <span className="material-symbols-outlined text-base">send</span>
                                </button>
                            </form>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
