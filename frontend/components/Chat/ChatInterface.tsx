"use client";

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
    id: string;
    conversationId: string;
    senderType: 'customer' | 'staff' | 'bank' | 'system';
    senderId: string;
    content: string;
    messageType: string;
    status: string;
    createdAt: string;
}

interface Conversation {
    id: string;
    customerPhone: string;
    customerName?: string;
    customerEmail?: string;
    metadata?: any;
    status: string;
    updatedAt: string;
    lastMessage?: Message;
}

interface ChatInterfaceProps {
    role: 'staff' | 'bank' | 'agent'; // What dashboard is this embedded in
    initialUser?: any;
    portalTitle?: string;
}

export default function ChatInterface({ role, initialUser, portalTitle }: ChatInterfaceProps) {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sidebarTab, setSidebarTab] = useState<'chats' | 'users'>('chats');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeConversationRef = useRef<string | null>(null);

    const apiUrl = "/api";

    // Sync ref with state
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    const fetchConversations = async () => {
        try {
            const res = await fetch(`${apiUrl}/chat/conversations?role=${role}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data: Conversation[] = await res.json();
            if (Array.isArray(data)) setConversations(data);
        } catch (e) {
            console.error("Failed to load conversations", e);
        }
    };

    const fetchUsers = async () => {
        if (role !== 'staff' && role !== 'agent') return;
        setLoadingUsers(true);
        try {
            const res = await fetch(`${apiUrl}/users/admin/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const responseData = await res.json();
            if (responseData.success && Array.isArray(responseData.data)) {
                setAllUsers(responseData.data);
            } else if (Array.isArray(responseData)) {
                // Fallback if API returns raw array
                setAllUsers(responseData);
            }
        } catch (e) {
            console.error("Failed to load users", e);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Initialize Socket Connection
    useEffect(() => {
        if (!token) return;

        fetchConversations();
        if (role === 'staff') fetchUsers();

        const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const socketUrl = baseApiUrl.endsWith('/api')
            ? baseApiUrl.replace('/api', '/chat')
            : `${baseApiUrl.replace(/\/$/, '')}/chat`;

        const socketInstance = io(socketUrl, {
            auth: { token }
        });

        socketInstance.on('connect', () => {
            console.log(`Connected to chat socket as ${role}`);
        });

        socketInstance.on('user_activity', (data: any) => {
            console.log("Activity detected:", data);
            fetchConversations();
        });

        socketInstance.on('conversation_updated', (data: { conversationId: string, lastMessage: Message }) => {
            setConversations(prev => {
                const exists = prev.find(c => c.id === data.conversationId);
                if (exists) {
                    const updated = prev.filter(c => c.id !== data.conversationId);
                    return [{ ...exists, lastMessage: data.lastMessage, updatedAt: data.lastMessage.createdAt }, ...updated];
                } else {
                    fetchConversations();
                    return prev;
                }
            });
        });

        socketInstance.on('new_message', (msg: Message) => {
            if (msg.conversationId === activeConversationRef.current) {
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [token, role]);

    // Handle active conversation change
    useEffect(() => {
        if (socket && activeConversation) {
            socket.emit('join_conversation', activeConversation);

            fetch(`${apiUrl}/chat/messages/${activeConversation}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setMessages(data);
                    scrollToBottom();
                }).catch(e => console.error("Could not load messages."));

            return () => {
                socket.emit('leave_conversation', activeConversation);
            };
        }
    }, [socket, activeConversation, token]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeConversation || !socket) return;

        const conv = conversations.find(c => c.id === activeConversation);

        socket.emit('send_message', {
            conversationId: activeConversation,
            customerPhone: conv?.customerPhone,
            content: inputText
        });

        setInputText('');
    };

    // Handle initialUser from props
    useEffect(() => {
        if (initialUser && token) {
            startNewChat(initialUser);
        }
    }, [initialUser, token]);

    const startNewChat = async (targetUser: any) => {
        if (!targetUser.phoneNumber) {
            alert("This user does not have a phone number registered.");
            return;
        }
        try {
            const res = await fetch(`${apiUrl}/chat/staff-start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    customerPhone: targetUser.phoneNumber,
                    customerEmail: targetUser.email,
                    customerName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim(),
                    type: role,
                    bank: role === 'bank' ? (user?.firstName || '') : undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                setSidebarTab('chats');
                setActiveConversation(data.conversation.id);
                fetchConversations();
            }
        } catch (e) {
            console.error("Failed to start chat", e);
        }
    }

    const filteredConversations = conversations.filter(c =>
        (c.customerName || c.customerPhone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = allUsers.filter(u =>
        u.role !== 'admin' && u.role !== 'staff' && u.role !== 'agent' &&
        (`${u.firstName} ${u.lastName} ${u.email} ${u.phoneNumber}`).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[800px] border border-gray-200 rounded-[2.5rem] overflow-hidden bg-white shadow-[0_24px_80px_rgba(17,24,39,0.08)] mt-6 animate-fade-in text-gray-900">

            {/* Sidebar: Conversations & Users */}
            <div className="w-80 border-r border-gray-200 bg-[#fbfbfd] flex flex-col">
                <div className="p-8 border-b border-gray-200 bg-[#fbfbfd]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-xl tracking-tight text-gray-900">{portalTitle || 'Conversations'}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSidebarTab('chats')}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${sidebarTab === 'chats' ? 'bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                            >
                                <span className="material-symbols-outlined text-sm font-black">forum</span>
                            </button>
                            {(role === 'staff' || role === 'agent') && (
                                <button
                                    onClick={() => setSidebarTab('users')}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${sidebarTab === 'users' ? 'bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                                >
                                    <span className="material-symbols-outlined text-sm font-black">person_add</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={sidebarTab === 'chats' ? "Search conversations..." : "Search students..."}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/10 transition-all text-gray-700"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-2">
                    {sidebarTab === 'chats' ? (
                        conversations.length === 0 ? (
                            <div className="p-10 text-center opacity-50">
                                <div className="w-16 h-16 rounded-[2rem] bg-white flex items-center justify-center mx-auto mb-4 border border-gray-200 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl">sensors_off</span>
                                </div>
                                <p className="text-xs font-medium text-gray-500">No active conversations</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv.id)}
                                    className={`px-6 py-5 cursor-pointer transition-all relative rounded-3xl group
                                    ${activeConversation === conv.id ? 'bg-[#6605c7] shadow-xl shadow-[#6605c7]/20' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${activeConversation === conv.id ? 'bg-white/20 text-white' : 'bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20'}`}>
                                                {(conv.customerName || conv.customerPhone)?.substring(0, 1)}
                                            </div>
                                            <div className="min-w-0">
                                                <span className={`font-black text-sm tracking-tight truncate block ${activeConversation === conv.id ? 'text-white' : 'text-gray-200'}`}>
                                                    {conv.customerName || conv.customerPhone}
                                                </span>
                                                <span className={`text-[10px] font-medium block mt-0.5 ${activeConversation === conv.id ? 'text-white/80' : 'text-gray-500'}`}>
                                                    Online
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-medium ${activeConversation === conv.id ? 'text-white/70' : 'text-gray-400'}`}>
                                            {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>

                                    <div className="text-xs font-medium opacity-70 truncate px-1">
                                        {conv.lastMessage ? conv.lastMessage.content : 'Starting conversation...'}
                                    </div>

                                    {conv.status === 'active' && activeConversation !== conv.id && (
                                        <div className="absolute right-6 bottom-6 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                                    )}
                                </div>
                            ))
                        )
                    ) : (
                        loadingUsers ? (
                            <div className="p-10 text-center"><div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" /></div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-10 text-center opacity-30"><p className="text-[10px] font-black uppercase">No users found</p></div>
                        ) : (
                            filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => startNewChat(u)}
                                    className="px-6 py-5 cursor-pointer transition-all relative rounded-3xl hover:bg-gray-50 group border border-transparent hover:border-gray-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#6605c7]/10 flex items-center justify-center font-black text-xs text-[#6605c7]">
                                            {u.firstName?.[0] || u.email?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="font-black text-sm tracking-tight truncate block text-gray-900">
                                                {u.firstName} {u.lastName}
                                            </span>
                                            <span className="text-xs font-medium block mt-0.5 text-gray-500">
                                                {u.email}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-[#6605c7]/10 text-[#6605c7] items-center justify-center hidden group-hover:flex">
                                            <span className="material-symbols-outlined text-sm">chat</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-8 bg-white border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-[#6605c7] flex items-center justify-center font-black text-2xl shadow-2xl shadow-[#6605c7]/20 border border-white text-white">
                                        {(conversations.find(c => c.id === activeConversation)?.customerName || conversations.find(c => c.id === activeConversation)?.customerPhone)?.substring(0, 1)}
                                    </div>
                                    <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-2xl tracking-tight text-gray-900">
                                            {conversations.find(c => c.id === activeConversation)?.customerName || conversations.find(c => c.id === activeConversation)?.customerPhone}
                                        </h4>
                                        <span className="px-3 py-1 bg-[#6605c7]/10 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#6605c7]/20">
                                            {conversations.find(c => c.id === activeConversation)?.customerEmail || 'Student'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 px-0.5">
                                        <div className="flex items-center gap-1.5 py-0.5 px-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">WhatsApp Connected</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">Verified Channel</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 group text-gray-700 shadow-sm">
                                    <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">description</span>
                                    Student Documents
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-10 overflow-y-auto no-scrollbar flex flex-col gap-8 bg-gradient-to-b from-[#fbfbfd] to-white">
                            <div className="flex justify-center mb-6">
                                <span className="px-4 py-1 bg-white border border-gray-200 text-[10px] text-gray-500 font-bold uppercase tracking-widest rounded-full shadow-sm">
                                    Message History
                                </span>
                            </div>

                            {messages.map(msg => {
                                const isStaffSide = msg.senderType === 'staff' || msg.senderType === 'bank';
                                const isCustomer = msg.senderType === 'customer';
                                const isMe = isStaffSide;

                                return (
                                    <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'} animate-slide-up`}>
                                        <div className="flex items-center gap-3 mb-2 px-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-indigo-500' : 'text-gray-500'}`}>
                                                {isCustomer ? 'Student' : (msg.senderType === 'system' ? 'System' : 'Support Agent')}
                                            </span>
                                            {isCustomer && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                                                    <span className="w-1 h-1 rounded-full bg-[#25D366]"></span>
                                                    <span className="text-[9px] text-[#25D366] font-bold uppercase tracking-wider">WhatsApp</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`p-5 rounded-[2rem] shadow-2xl relative border ${isMe
                                            ? 'bg-[#6605c7] text-white rounded-tr-none border-[#6605c7]/10'
                                            : isCustomer
                                                ? 'bg-white border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
                                                : 'bg-emerald-600 text-white rounded-tl-none border-emerald-600/10'
                                            }`}>
                                            <p className="text-sm font-medium leading-relaxed tracking-tight">{msg.content}</p>
                                        </div>

                                        <div className={`mt-3 flex items-center gap-3 px-1 text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-[#6605c7]/60' : 'text-gray-500'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMe && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                                    <span>Delivered</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Panel */}
                        <div className="p-8 bg-white border-t border-gray-200">
                            <form onSubmit={handleSendMessage} className="flex gap-6 items-center">
                                <button type="button" className="w-14 h-14 bg-white hover:bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 transition-all border border-gray-200 shadow-sm">
                                    <span className="material-symbols-outlined font-black">add</span>
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Type your message here..."
                                        className="w-full bg-[#fbfbfd] border border-gray-200 rounded-2xl px-8 py-5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/10 transition-all font-medium"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className="w-16 h-16 bg-[#6605c7] text-white rounded-2xl flex items-center justify-center hover:bg-[#4f0399] disabled:opacity-20 transition-all shadow-2xl shadow-[#6605c7]/20 active:scale-95 group"
                                >
                                    <span className="material-symbols-outlined font-black group-hover:rotate-12 transition-transform">send</span>
                                </button>
                            </form>
                            <div className="flex justify-between items-center mt-6 px-1">
                                <div className="flex items-center gap-3 opacity-30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#6605c7]"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Secure Messaging</span>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Press Enter to send</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#fbfbfd] to-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#6605c7]/5 to-transparent"></div>
                        <div className="text-center relative z-10 animate-fade-in">
                            <div className="w-32 h-32 rounded-[3.5rem] bg-[#6605c7]/10 text-[#6605c7] flex items-center justify-center mx-auto mb-10 shadow-3xl border border-[#6605c7]/10 relative">
                                <div className="absolute inset-0 rounded-[3.5rem] animate-ping-slow bg-[#6605c7]/5"></div>
                                <span className="material-symbols-outlined text-6xl">leak_add</span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight mb-4 text-gray-900">Communication Center</h3>
                            <p className="text-gray-500 font-medium text-sm">Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
