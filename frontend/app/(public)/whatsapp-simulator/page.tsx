"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhatsAppSimulator() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [phone, setPhone] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleConnect = () => {
        if (!phone.trim()) return;

        const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const socketUrl = baseApiUrl.endsWith('/api') 
            ? baseApiUrl.replace('/api', '/chat')
            : `${baseApiUrl.replace(/\/$/, '')}/chat`;

        const socketInstance = io(socketUrl, {
            auth: { 
                simulator: true,
                phone: phone.trim()
            }
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
            fetch(`/api/webhook/whatsapp/history/${phone.trim()}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setMessages(data);
                })
                .catch(e => console.error("Could not load history"));
        });

        socketInstance.on('wa_message_received', (msg: any) => {
            setMessages(prev => [...prev, msg]);
            if (navigator.vibrate) navigator.vibrate(200);
        });

        socketInstance.on('disconnect', () => setIsConnected(false));
        setSocket(socketInstance);
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket) return;

        socket.emit('sim_customer_reply', {
            phone: phone.trim(),
            content: inputText
        }, (res: any) => {
            if (res?.success) {
                setMessages(prev => [...prev, res.message]);
            }
        });

        setInputText('');
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#fbfbfd] to-white flex items-center justify-center p-6 font-display overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6605c7]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full z-10"
                >
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 bg-gradient-to-tr from-[#6605c7] to-[#a855f7] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#6605c7]/20 rotate-[10deg] hover:rotate-0 transition-all duration-500 border border-white">
                            <span className="material-symbols-outlined text-white text-5xl">hub</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter italic uppercase">WA NODE</h1>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Simulator Initialization</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-10 rounded-[3rem] shadow-[0_24px_80px_rgba(17,24,39,0.08)]">
                        <div className="space-y-6">
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] mb-3 block px-1">Signal Origin</label>
                                <input 
                                    type="text" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter Customer Phone"
                                    className="w-full bg-[#fbfbfd] border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/10 transition-all text-sm font-bold tracking-tight placeholder-gray-400"
                                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                                />
                            </div>
                            <button 
                                onClick={handleConnect}
                                className="w-full py-5 bg-[#6605c7] text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:bg-[#4f0399] active:scale-[0.98] transition-all shadow-xl shadow-[#6605c7]/20"
                            >
                                Connect to Bridge
                            </button>
                        </div>

                        <div className="mt-10 flex items-center gap-3 justify-center opacity-30">
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Cloud Node Ready</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gradient-to-b from-[#fbfbfd] to-white flex items-center justify-center font-display p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(102,5,199,0.08),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_30%)]" />
            
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 h-[90vh] relative z-10">
                
                {/* Simulator Status Panel */}
                <div className="lg:col-span-4 hidden lg:flex flex-col gap-6 h-full">
                    <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 flex-1 shadow-[0_20px_60px_rgba(17,24,39,0.06)]">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-[#6605c7] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6605c7]/20 border border-white text-white">
                                <span className="material-symbols-outlined text-white text-xl">sensors</span>
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-black text-lg tracking-tight uppercase italic underline underline-offset-4 decoration-[#6605c7]">Live Simulation</h3>
                                <p className="text-[8px] font-black uppercase tracking-widest text-[#25D366] mt-1">Bridge Active</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 block">Target Node</label>
                                <div className="p-4 bg-[#fbfbfd] rounded-2xl border border-gray-200">
                                    <p className="text-gray-900 font-bold text-sm">{phone}</p>
                                    <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-tighter">Student Applicant</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 block">Simulator Info</label>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                                    This console mimics the WhatsApp interface to allow real-time testing of the staff/bank communication node.
                                </p>
                            </div>

                            <div className="pt-8 border-t border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Encryption</span>
                                    <span className="text-[10px] font-black text-[#6605c7]">Node-to-Node</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Latency</span>
                                    <span className="text-[10px] font-black text-[#6605c7]">0.02ms</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => window.location.reload()}
                        className="p-6 bg-red-50 border border-red-100 text-red-600 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all text-center"
                    >
                        Terminate Node Connection
                    </button>
                </div>

                {/* Mobile UI Prototype */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-[3.5rem] shadow-[0_28px_90px_rgba(17,24,39,0.10)] border border-gray-200 overflow-hidden relative">
                    
                    {/* Header */}
                    <div className="bg-white p-6 pr-8 border-b border-gray-200 flex items-center justify-between z-20">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#6605c7] flex items-center justify-center text-white text-xl font-black shadow-2xl shadow-[#6605c7]/20 border border-white/80">
                                {phone.substring(0, 1)}
                            </div>
                            <div>
                                <h4 className="text-gray-900 font-black text-xl tracking-tighter italic uppercase">{phone}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse shadow-[0_0_8px_#25D366]" />
                                    <span className="text-[9px] text-[#25D366] font-black uppercase tracking-widest">Active via Bridge</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-6 opacity-40 text-gray-500">
                            <span className="material-symbols-outlined">videocam</span>
                            <span className="material-symbols-outlined">call</span>
                            <span className="material-symbols-outlined">info</span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-gradient-to-b from-[#fbfbfd] to-white">
                        <AnimatePresence initial={false}>
                            {messages.length === 0 && (
                                <div className="flex justify-center my-10">
                                    <span className="bg-white text-gray-500 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-gray-200 shadow-sm">
                                        Initializing Transmissions...
                                    </span>
                                </div>
                            )}
                            {messages.map((msg, i) => {
                                const isCustomer = msg.senderType === 'customer';
                                return (
                                    <motion.div 
                                        key={msg.id || i}
                                        initial={{ opacity: 0, x: isCustomer ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex flex-col max-w-[80%] ${isCustomer ? 'self-end items-end' : 'self-start items-start'}`}
                                    >
                                        <div className={`p-5 rounded-[2rem] shadow-2xl relative border ${isCustomer 
                                            ? 'bg-[#6605c7] text-white rounded-tr-none border-[#6605c7]/10' 
                                            : 'bg-white border-gray-200 text-gray-700 rounded-tl-none font-medium shadow-sm'}`}
                                        >
                                            <p className="text-sm leading-relaxed tracking-tight">{msg.content}</p>
                                        </div>
                                        <div className={`flex items-center gap-2 mt-3 px-2 text-[8px] font-black uppercase tracking-[0.2em] ${isCustomer ? 'text-[#6605c7]/60' : 'text-gray-500'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isCustomer && <span className="material-symbols-outlined text-[10px] text-[#25D366]">done_all</span>}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="bg-white p-8 mt-auto border-t border-gray-200">
                        <form onSubmit={handleSend} className="flex items-center gap-5">
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type signal to transmit..."
                                    className="w-full bg-[#fbfbfd] border border-gray-200 rounded-2xl px-6 py-4 text-gray-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/10 placeholder:text-gray-400 font-medium"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={!inputText.trim()}
                                className="w-14 h-14 bg-[#6605c7] hover:bg-[#4f0399] text-white rounded-2xl flex items-center justify-center transition-all shadow-2xl shadow-[#6605c7]/20 disabled:opacity-20 active:scale-95 group"
                            >
                                <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    );
}
