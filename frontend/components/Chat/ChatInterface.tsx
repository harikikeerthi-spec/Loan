"use client";

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { HttpApiPaths } from '@/lib/http-api-paths';

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
    initialBank?: { bankName: string; bankEmail?: string; applicationId?: string; applicationNumber?: string } | null;
    portalTitle?: string;
    className?: string;
    hideSidebar?: boolean;
}

interface StudentDocument {
    id: string;
    docType: string;
    name?: string;
    status?: string;
    uploaded?: boolean;
    fileName?: string;
    filePath?: string;
    uploadedAt?: string;
}

export default function ChatInterface({ role, initialUser, initialBank, portalTitle, className, hideSidebar = false }: ChatInterfaceProps) {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sidebarTab, setSidebarTab] = useState<'chats' | 'users'>('chats');
    // 'all' | 'student' | 'bank' — for staff to filter which conversation type they see
    const [chatTypeFilter, setChatTypeFilter] = useState<'all' | 'student' | 'bank'>('all');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Document panel state
    const [showDocPanel, setShowDocPanel] = useState(false);
    const [studentDocs, setStudentDocs] = useState<StudentDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [docsUserId, setDocsUserId] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
    const [previewLoading, setPreviewLoading] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeConversationRef = useRef<string | null>(null);

    // Sync ref with state
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    const fetchConversations = async () => {
        try {
            const res = await fetch(HttpApiPaths.chat.conversations(role), {
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
            const res = await fetch(HttpApiPaths.admin.usersList(30, 0), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const responseData = await res.json();
            if (responseData.success && Array.isArray(responseData.data)) {
                setAllUsers(responseData.data);
            } else if (Array.isArray(responseData)) {
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

        const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || (
            typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
                ? window.location.origin
                : 'http://localhost:5000'
        );
        const socketUrl = baseApiUrl.endsWith('/api')
            ? baseApiUrl.replace('/api', '/chat')
            : `${baseApiUrl.replace(/\/$/, '')}/chat`;

        const socketInstance = io(socketUrl, {
            auth: { token }
        });

        socketInstance.on('connect', () => {
            console.log(`Connected to chat socket as ${role}`);
            fetchConversations();
        });

        const pollInterval = setInterval(() => {
            fetchConversations();
        }, 10000);

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
            setConversations(prev => {
                const exists = prev.find(c => c.id === msg.conversationId);
                if (exists) {
                    const updated = prev.filter(c => c.id !== msg.conversationId);
                    return [{ ...exists, lastMessage: msg, updatedAt: msg.createdAt }, ...updated];
                }
                return prev;
            });
        });

        setSocket(socketInstance);

        return () => {
            clearInterval(pollInterval);
            socketInstance.disconnect();
        };
    }, [token, role]);

    // Handle active conversation change
    useEffect(() => {
        if (socket && activeConversation) {
            socket.emit('join_conversation', activeConversation);

            fetch(HttpApiPaths.chat.messages(activeConversation), {
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

    const startNewChat = async (targetUser: any) => {
        if (!targetUser.phoneNumber) {
            alert("This user does not have a phone number registered.");
            return;
        }
        try {
            const res = await fetch(HttpApiPaths.chat.staffStart(), {
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
                setChatTypeFilter('student');
                setActiveConversation(data.conversation.id);
                fetchConversations();
            }
        } catch (e) {
            console.error("Failed to start chat", e);
        }
    }

    const startBankChat = async (bankInfo: { bankName: string; bankEmail?: string; applicationId?: string; applicationNumber?: string }) => {
        try {
            const res = await fetch(HttpApiPaths.chat.bankStart(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(bankInfo)
            });
            const data = await res.json();
            if (data.success) {
                setSidebarTab('chats');
                setChatTypeFilter('bank');
                setActiveConversation(data.conversation.id);
                fetchConversations();
            }
        } catch (e) {
            console.error("Failed to start bank chat", e);
        }
    }

    // Handle initialUser from props
    useEffect(() => {
        if (initialUser && token) {
            startNewChat(initialUser);
        }
    }, [initialUser, token]);

    // Handle initialBank from props
    useEffect(() => {
        if (initialBank && token) {
            startBankChat(initialBank);
        }
    }, [initialBank, token]);

    // Fetch student documents for the active conversation
    const openStudentDocuments = async () => {
        const conv = conversations.find(c => c.id === activeConversation);
        if (!conv) return;

        // Try to find userId from conversation metadata or email match
        const customerEmail = conv.customerEmail || conv.metadata?.customerEmail;
        let userId: string | null = null;

        // Look up userId from the users list
        if (customerEmail && allUsers.length > 0) {
            const match = allUsers.find((u: any) => u.email?.toLowerCase() === customerEmail?.toLowerCase());
            if (match) userId = match.id || match._id || match.uid;
        }

        // If not found from users list, try via API
        if (!userId && customerEmail) {
            try {
                const res = await fetch(`/api/users/admin/list?search=${encodeURIComponent(customerEmail)}&limit=1`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                const found = data?.data?.[0] || data?.[0];
                if (found) userId = found.id || found._id || found.uid;
            } catch (_) { /* ignore */ }
        }

        setDocsUserId(userId);
        setShowDocPanel(true);

        if (!userId) {
            setStudentDocs([]);
            return;
        }

        setLoadingDocs(true);
        try {
            const res = await fetch(HttpApiPaths.documents.byUserId(userId), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const docs: StudentDocument[] = (data?.data || data || []).filter(
                (d: StudentDocument) => d.uploaded || ['uploaded', 'verified', 'approved'].includes(String(d.status || '').toLowerCase())
            );
            setStudentDocs(docs);
        } catch (e) {
            console.error("Failed to load student documents:", e);
            setStudentDocs([]);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleViewDocument = async (doc: StudentDocument) => {
        if (!docsUserId) return;
        setPreviewLoading(doc.docType);
        try {
            const res = await fetch(HttpApiPaths.documents.presignedView(docsUserId, doc.docType), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.url) {
                    setPreviewDoc({ url: data.url, name: (doc.name || doc.docType).toUpperCase().replace(/_/g, ' ') });
                    return;
                }
            }
        } catch (_) { /* fallback */ }
        // Fallback stream URL
        setPreviewDoc({
            url: HttpApiPaths.documents.streamView(docsUserId, doc.docType),
            name: (doc.name || doc.docType).toUpperCase().replace(/_/g, ' ')
        });
        setPreviewLoading(null);
    };

    const handleDownloadDocument = async (doc: StudentDocument) => {
        if (!docsUserId) return;
        try {
            const res = await fetch(HttpApiPaths.documents.presignedView(docsUserId, doc.docType), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.url) {
                    const link = document.createElement('a');
                    link.href = data.url;
                    link.download = `${(doc.name || doc.docType).replace(/\s+/g, '_')}.pdf`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                }
            }
        } catch (_) { /* fallback */ }
        window.open(HttpApiPaths.documents.streamView(docsUserId, doc.docType), '_blank', 'noopener,noreferrer');
    };

    const getDocStatusColor = (status?: string, uploaded?: boolean) => {
        const s = String(status || '').toLowerCase();
        if (s === 'verified' || s === 'approved') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Verified' };
        if (s === 'rejected') return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', label: 'Rejected' };
        if (uploaded || s === 'uploaded') return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Uploaded' };
        return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Pending' };
    };

    const filteredConversations = conversations.filter(c => {
        const matchesSearch = (c.customerName || c.customerPhone || '').toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (role !== 'staff') return true; // bank/agent: no extra filter
        if (chatTypeFilter === 'bank') return c.metadata?.type === 'bank';
        if (chatTypeFilter === 'student') return c.metadata?.type !== 'bank';
        return true; // 'all'
    });

    const filteredUsers = allUsers.filter(u =>
        u.role !== 'admin' && u.role !== 'staff' && u.role !== 'agent' &&
        (`${u.firstName} ${u.lastName} ${u.email} ${u.phoneNumber}`).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={className || "flex h-[800px] border border-gray-200 rounded-[2.5rem] overflow-hidden bg-white shadow-[0_24px_80px_rgba(17,24,39,0.08)] mt-6 animate-fade-in text-gray-900"}>

            {/* Sidebar: Conversations & Users */}
            {!hideSidebar && (
                <div className="w-80 border-r border-gray-200 bg-[#fbfbfd] flex flex-col">
                    <div className="p-8 border-b border-gray-200 bg-[#fbfbfd]">
                        <div className="flex items-center justify-between mb-4">
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

                        {/* Student / Bank filter tabs — only for staff when in chats tab */}
                        {role === 'staff' && sidebarTab === 'chats' && (
                            <div className="flex gap-1 mb-4 p-1 bg-white border border-gray-200 rounded-2xl">
                                {(['all', 'student', 'bank'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setChatTypeFilter(type)}
                                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                                            chatTypeFilter === type
                                                ? type === 'bank'
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : type === 'student'
                                                        ? 'bg-[#6605c7] text-white shadow-sm'
                                                        : 'bg-gray-900 text-white shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[12px]">
                                            {type === 'bank' ? 'account_balance' : type === 'student' ? 'school' : 'all_inclusive'}
                                        </span>
                                        {type === 'all' ? 'All' : type === 'student' ? 'Students' : 'Banks'}
                                    </button>
                                ))}
                            </div>
                        )}

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
                                filteredConversations.map(conv => {
                                    const isBank = conv.metadata?.type === 'bank';
                                    const activeStyle = activeConversation === conv.id;
                                    const activeBg = isBank
                                        ? 'bg-amber-500 shadow-xl shadow-amber-500/20'
                                        : 'bg-[#6605c7] shadow-xl shadow-[#6605c7]/20';
                                    return (
                                    <div
                                        key={conv.id}
                                        onClick={() => { setActiveConversation(conv.id); setShowDocPanel(false); }}
                                        className={`px-6 py-5 cursor-pointer transition-all relative rounded-3xl group
                                        ${activeStyle ? activeBg : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                                                    activeStyle
                                                        ? 'bg-white/20 text-white'
                                                        : isBank
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20'
                                                }`}>
                                                    {isBank
                                                        ? <span className="material-symbols-outlined text-[16px]">account_balance</span>
                                                        : (conv.customerName || conv.customerPhone)?.substring(0, 1)
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <span className={`font-black text-sm tracking-tight truncate block ${activeStyle ? 'text-white' : 'text-gray-800'}`}>
                                                        {conv.customerName || conv.customerPhone}
                                                    </span>
                                                    <span className={`text-[10px] font-medium block mt-0.5 ${activeStyle ? 'text-white/80' : isBank ? 'text-amber-600' : 'text-gray-500'}`}>
                                                        {isBank ? '🏦 Bank Channel' : 'Online'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-medium ${activeStyle ? 'text-white/70' : 'text-gray-400'}`}>
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
                                    );
                                })
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
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex overflow-hidden bg-white relative">
                {/* Chat column */}
                <div className={`flex flex-col transition-all duration-300 ${showDocPanel ? 'flex-1' : 'w-full'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-8 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
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
                                <div className="flex gap-3">
                                    <button
                                        onClick={openStudentDocuments}
                                        className={`px-5 py-3 border rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 group shadow-sm ${showDocPanel
                                            ? 'bg-[#6605c7] text-white border-[#6605c7] shadow-[#6605c7]/20'
                                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-lg transition-transform ${showDocPanel ? 'rotate-0' : 'group-hover:rotate-12'}`}>description</span>
                                        Student Documents
                                        {showDocPanel && studentDocs.length > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[9px] font-black flex items-center justify-center">
                                                {studentDocs.length}
                                            </span>
                                        )}
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
                            <div className="p-8 bg-white border-t border-gray-200 shrink-0">
                                {/* Message Presets */}
                                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1.5 scroll-smooth">
                                    {[
                                        { label: "Missing Marks", text: "Hello! We have reviewed your initial dossier but require the original 10th and 12th standard marksheets. Please upload them in the Document Vault." },
                                        { label: "Processing Fee", text: "Dear applicant, processing fees of ₹17,700 (including 18% GST) are due to advance sanctioning. Kindly deposit upfront or select deduction." },
                                        { label: "Co-Applicant KYC", text: "Hello! To proceed with duplicate checks, please upload your co-applicant's verified Aadhaar and PAN documents." },
                                        { label: "Clarification Memo", text: "Dear applicant, a credit audit query has been raised on your files. Kindly check the Queries Tab and submit responses." }
                                    ].map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setInputText(preset.text)}
                                            className="px-3.5 py-2 bg-purple-50 hover:bg-[#6605c7] border border-purple-100/50 hover:border-[#6605c7] text-[#6605c7] hover:text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all shrink-0 shadow-sm"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
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

                {/* Document Side Panel */}
                {showDocPanel && activeConversation && (
                    <div className="w-80 border-l border-gray-200 bg-[#fbfbfd] flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
                        {/* Panel Header */}
                        <div className="px-6 py-5 border-b border-gray-200 bg-white flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#6605c7]">Document Vault</p>
                                <h5 className="text-sm font-black text-gray-900 mt-0.5">
                                    {conversations.find(c => c.id === activeConversation)?.customerName || 'Student'}&apos;s Files
                                </h5>
                            </div>
                            <button
                                onClick={() => { setShowDocPanel(false); setPreviewDoc(null); }}
                                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {/* Document List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                            {loadingDocs ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <div className="w-10 h-10 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading documents...</p>
                                </div>
                            ) : !docsUserId ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-4">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-amber-500 text-[28px]">person_search</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-500">Student profile not found for this conversation.</p>
                                    <p className="text-[10px] text-gray-400">Make sure the student has a registered account linked to this phone/email.</p>
                                </div>
                            ) : studentDocs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-slate-400 text-[28px]">folder_open</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-500">No uploaded documents found for this student.</p>
                                </div>
                            ) : (
                                studentDocs.map(doc => {
                                    const sc = getDocStatusColor(doc.status, doc.uploaded);
                                    const docLabel = (doc.name || doc.docType || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                    const isLoadingThis = previewLoading === doc.docType;
                                    return (
                                        <div
                                            key={doc.id || doc.docType}
                                            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className={`w-9 h-9 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center shrink-0`}>
                                                    <span className={`material-symbols-outlined text-[18px] ${sc.text}`}>description</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] font-black text-gray-900 truncate">{docLabel}</p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                                                        <span className={`text-[9px] font-bold uppercase ${sc.text}`}>{sc.label}</span>
                                                    </div>
                                                    {doc.fileName && (
                                                        <p className="text-[9px] text-gray-400 font-medium mt-1 truncate">{doc.fileName}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewDocument(doc)}
                                                    disabled={isLoadingThis}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#6605c7]/5 hover:bg-[#6605c7] text-[#6605c7] hover:text-white border border-[#6605c7]/20 hover:border-[#6605c7] rounded-xl text-[10px] font-black uppercase tracking-wide transition-all"
                                                >
                                                    {isLoadingThis ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                    )}
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadDocument(doc)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">download</span>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Panel Footer */}
                        {docsUserId && !loadingDocs && (
                            <div className="px-5 py-3 border-t border-gray-200 bg-white">
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">
                                    {studentDocs.length} uploaded document{studentDocs.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Document Preview Modal */}
            {previewDoc && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-end p-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setPreviewDoc(null)}
                >
                    <div
                        className="w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Preview Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]">Document Viewer</span>
                                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{previewDoc.name}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={previewDoc.url}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center"
                                    title="Download"
                                >
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                </a>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 bg-slate-100/40 p-8 flex items-center justify-center overflow-auto">
                            {previewDoc.url.toLowerCase().includes('.pdf') ||
                                previewDoc.name.toLowerCase().includes('pdf') ||
                                !/\.(jpg|jpeg|png|webp|gif)/i.test(previewDoc.url.split('?')[0]) ? (
                                <iframe
                                    src={previewDoc.url}
                                    className="w-full h-full rounded-2xl border border-slate-200 bg-white shadow-xl"
                                    title={previewDoc.name}
                                    onLoad={() => setPreviewLoading(null)}
                                />
                            ) : (
                                <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl bg-white p-4 border border-slate-200">
                                    <img
                                        src={previewDoc.url}
                                        alt={previewDoc.name}
                                        className="max-w-full max-h-[70vh] object-contain rounded-xl"
                                        onLoad={() => setPreviewLoading(null)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
