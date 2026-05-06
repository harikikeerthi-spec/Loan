"use client";

import { useState } from "react";

const ChatListItem = ({ chat, active, onClick }: any) => (
    <button 
        onClick={() => onClick(chat)}
        className={`w-full flex items-center gap-4 px-6 py-5 border-l-4 transition-all duration-300 group ${
            active 
            ? "bg-[#1d4ed8]/5 border-[#1d4ed8] shadow-[inset_4px_0_0_0_#1d4ed8]" 
            : "bg-white border-transparent hover:bg-gray-50 text-gray-500"
        }`}
    >
        <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[12px] shadow-sm transform transition-all duration-500 ${
            active ? "bg-[#1d4ed8] text-white rotate-6 scale-110" : "bg-gray-100 group-hover:rotate-6 group-hover:scale-105"
        }`}>
            {chat.firstName?.[0]}{chat.lastName?.[0]}
            {chat.online && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
            )}
        </div>
        <div className="flex-1 text-left min-w-0">
            <div className="flex justify-between items-center mb-1">
                <span className={`text-[11px] font-black uppercase tracking-widest ${active ? "text-[#1d4ed8]" : "text-gray-900"}`}>
                    {chat.firstName} {chat.lastName}
                </span>
                <span className="text-[8px] font-bold text-gray-400 font-mono tracking-tighter uppercase whitespace-nowrap ml-2">
                    {chat.lastActive}
                </span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 truncate tracking-tight lowercase">
                {chat.lastMessage}
            </p>
        </div>
        {chat.unread > 0 && (
            <div className="w-5 h-5 rounded-full bg-[#1d4ed8] flex items-center justify-center text-[8px] font-black text-white shadow-lg shadow-blue-500/20 animate-pulse">
                {chat.unread}
            </div>
        )}
    </button>
);

const Message = ({ msg, isSender }: any) => (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} mb-6 group`}>
        <div className={`max-w-[70%] px-6 py-4 rounded-3xl relative shadow-sm transition-all duration-300 ${
            isSender 
            ? "bg-gradient-to-br from-[#1d4ed8] to-[#1e40af] text-white rounded-tr-none hover:scale-[1.01]" 
            : "bg-white text-gray-800 rounded-tl-none border border-gray-100 hover:scale-[1.01]"
        }`}>
            <p className="text-[11px] font-bold leading-relaxed">{msg.text}</p>
            <div className={`flex items-center gap-1.5 mt-2 transition-opacity duration-300 ${isSender ? "justify-end text-white/40" : "justify-start text-gray-400"}`}>
                <span className="text-[8px] font-black uppercase tracking-widest font-mono">{msg.time}</span>
                {isSender && (
                    <span className="material-symbols-outlined text-[10px] opacity-60">done_all</span>
                )}
            </div>
            
            <button className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-gray-400 shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-gray-50 hover:text-[#1d4ed8]">
                <span className="material-symbols-outlined text-[12px]">reply</span>
            </button>
        </div>
    </div>
);

export default function StaffChatComponent({ type }: { type: 'bank' | 'customer' }) {
    const [activeChat, setActiveChat] = useState<any>(null);
    const [input, setInput] = useState("");

    // Mock data based on type
    const chats = type === 'bank' ? [
        { id: "b1", firstName: "IDFC", lastName: "First", lastMessage: "We have reviewed the profile.", lastActive: "Just Now", unread: 1, online: true },
        { id: "b2", firstName: "Avanse", lastName: "Financial", lastMessage: "Pending collateral documents.", lastActive: "10m ago", unread: 0, online: true },
    ] : [
        { id: "c1", firstName: "Rahul", lastName: "Sharma", lastMessage: "Can you help me with my bank application?", lastActive: "5m ago", unread: 2, online: true },
        { id: "c2", firstName: "Priya", lastName: "Singh", lastMessage: "Thanks for the support!", lastActive: "1h ago", unread: 0, online: false },
    ];

    const messages = [
        { id: "m1", text: type === 'bank' ? "Hello Partner, please check APP-001 documentation." : "Hello! How can I assist you with your application today?", isSender: true, time: "10:00 AM" },
        { id: "m2", text: type === 'bank' ? "We have received the documents. Processing." : "I am facing an issue uploading my passport.", isSender: false, time: "10:15 AM" },
    ];

    const quickReplies = type === 'bank' ? [
        { label: "Check Status", text: "What is the current status of the application?" },
        { label: "Send Reminder", text: "Please expedite this case, user is waiting." },
    ] : [
        { label: "Request Docs", text: "Could you please upload the remaining documents?" },
        { label: "Status Update", text: "Your application is currently being reviewed by the bank." },
    ];

    const headerTitle = type === 'bank' ? "Bank Partners" : "Customers";

    return (
        <div className="h-full flex bg-[#f7f5f8] overflow-hidden rounded-[2.5rem] shadow-xl border border-gray-100">
            {/* Sidebar with Chats */}
            <aside className="w-80 flex flex-col border-r border-gray-100 bg-white">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-sm font-black font-display text-gray-900 tracking-tight uppercase mb-4">{headerTitle}</h3>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20 focus:bg-white transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    {chats.map((chat) => (
                        <ChatListItem 
                            key={chat.id} 
                            chat={chat} 
                            active={activeChat?.id === chat.id} 
                            onClick={setActiveChat} 
                        />
                    ))}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-50/50">
                {activeChat ? (
                    <>
                        <div className="h-20 px-8 border-b border-gray-100 bg-white flex items-center justify-between sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-[#1d4ed8] flex items-center justify-center font-black text-white text-[12px]">
                                    {activeChat.firstName?.[0]}{activeChat.lastName?.[0]}
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-900">{activeChat.firstName} {activeChat.lastName}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${activeChat.online ? "bg-emerald-500" : "bg-gray-300"}`} />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                                            {activeChat.online ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-10 space-y-6">
                            {messages.map((msg) => (
                                <Message key={msg.id} msg={msg} isSender={msg.isSender} />
                            ))}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white">
                            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar scroll-smooth">
                                {quickReplies.map((reply, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setInput(reply.text)}
                                        className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    >
                                        {reply.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4 items-center bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-blue-200 focus-within:bg-white transition-all shadow-sm">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none text-xs font-bold focus:ring-0 placeholder:text-gray-400 px-2"
                                />
                                <button 
                                    disabled={!input.trim()}
                                    className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                                        input.trim() 
                                        ? "bg-[#1d4ed8] text-white hover:bg-blue-800" 
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">chat</span>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Select a conversation to start chatting</p>
                    </div>
                )}
            </main>
        </div>
    );
}
