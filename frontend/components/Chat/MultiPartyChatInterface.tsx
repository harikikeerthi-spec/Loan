'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Participant {
  id: string;
  email: string;
  role: string;
  fullName: string;
  joinedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderType: string;
  senderId: string;
  content: string;
  messageType: string;
  status: string;
  createdAt: string;
  Message_Recipient?: Array<{ recipientEmail: string; status: string; readAt?: string }>;
}

interface Document_Share {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  uploadedBy: string;
  uploaderRole: string;
  status: string;
  sharedWith: string[];
  sharedWithRoles: string[];
  createdAt: string;
}

interface Conversation {
  id: string;
  applicationId: string;
  conversationTopic: string;
  isMultiParty: boolean;
  status: string;
  updatedAt: string;
  metadata?: any;
}

export default function MultiPartyChatInterface({ applicationId }: { applicationId?: string }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Grouped participants by role
  const getGroupedParticipants = () => {
    return {
      admin: participants.filter(p => p.role.toLowerCase() === 'admin'),
      staff: participants.filter(p => p.role.toLowerCase() === 'staff'),
      agent: participants.filter(p => p.role.toLowerCase() === 'agent'),
      client: participants.filter(p => p.role.toLowerCase() === 'client' || p.role.toLowerCase() === 'user'),
      others: participants.filter(p => 
        !['admin', 'staff', 'agent', 'client', 'user'].includes(p.role.toLowerCase())
      )
    };
  };

  const groupedParticipants = getGroupedParticipants();

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [conversationTopic, setConversationTopic] = useState('General Discussion');

  // Message & participant state
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<Document_Share[]>([]);

  // UI state
  const [inputText, setInputText] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showEmailNotif, setShowEmailNotif] = useState(false);
  const [selectedEmailRecipient, setSelectedEmailRecipient] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = '/api';

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socketUrl = baseApiUrl.endsWith('/api')
      ? baseApiUrl.replace('/api', '/chat')
      : `${baseApiUrl.replace(/\/$/, '')}/chat`;

    const socketInstance = io(socketUrl, { auth: { token } });

    socketInstance.on('connect', () => console.log('Connected to multiparty chat'));
    socketInstance.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    socketInstance.on('participant_joined', (data: any) => {
      setParticipants((prev) => [...prev, data.participant]);
    });
    socketInstance.on('document_shared', (doc: Document_Share) => {
      setSharedDocuments((prev) => [...prev, doc]);
    });

    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/chat/conversations/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
        if (applicationId && !activeConversation) {
          const appConv = data.data.find((c: Conversation) => c.applicationId === applicationId);
          if (appConv) setActiveConversation(appConv.id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch conversations', e);
    }
  }, [token, applicationId, activeConversation]);

  // Fetch conversation details
  const fetchConversationDetails = useCallback(async () => {
    if (!activeConversation || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/chat/multiparty/${activeConversation}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
        setSharedDocuments(data.data.documents);
        setParticipants(data.data.participants);
      }
    } catch (e) {
      console.error('Failed to fetch conversation details', e);
    } finally {
      setLoading(false);
    }
  }, [activeConversation, token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || !token) return;

    try {
      const res = await fetch(`${apiUrl}/chat/multiparty/${activeConversation}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: inputText }),
      });

      const data = await res.json();
      if (data.success) {
        setInputText('');
        socket?.emit('send_multiparty_message', data.data);
      }
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  // Send email notification
  const handleSendEmailNotif = async () => {
    if (!selectedEmailRecipient || !activeConversation || !token) return;

    try {
      const res = await fetch(`${apiUrl}/chat/multiparty/${activeConversation}/notify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipientEmail: selectedEmailRecipient,
          messageContent: inputText,
          conversationTopic: emailSubject || conversationTopic,
          applicationNumber: activeConversation,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Email sent successfully');
        setShowEmailNotif(false);
        setSelectedEmailRecipient('');
        setEmailSubject('');
      }
    } catch (e) {
      console.error('Failed to send email', e);
    }
  };

  const currentConversation = conversations.find((c) => c.id === activeConversation);

  return (
    <div className="flex h-[800px] border border-gray-100 rounded-[2rem] overflow-hidden bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-fade-in text-slate-900 font-sans tracking-tight">
      {/* Sidebar: Conversations */}
      <div className="w-85 border-r border-gray-100 bg-[#f9fafb] flex flex-col overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-white">
          <h3 className="font-extrabold text-2xl tracking-tight text-slate-900">Workspace</h3>
          <p className="text-[13px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">Active Channels</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`mx-3 mb-1 p-4 rounded-2xl cursor-pointer transition-all duration-200 group ${
                activeConversation === conv.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-transparent text-slate-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <p
                  className={`font-semibold text-[15px] leading-snug ${
                    activeConversation === conv.id ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {conv.conversationTopic}
                </p>
                {conv.isMultiParty && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    activeConversation === conv.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    MP
                  </span>
                )}
              </div>
              <p
                className={`text-[12px] mt-2 font-medium opacity-80 ${
                  activeConversation === conv.id ? 'text-indigo-100' : 'text-slate-400'
                }`}
              >
                {conv.isMultiParty ? `${participants.length} Active Members` : '1-on-1 Session'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {activeConversation && currentConversation ? (
          <>
            {/* Header */}
            <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-900 tracking-tight">{currentConversation.conversationTopic}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[13px] font-medium text-slate-400">
                      {participants.length} Participants Online
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                    showParticipants 
                      ? 'bg-[#6605c7] text-white shadow-lg' 
                      : 'bg-white border border-gray-100 text-[#6605c7] hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">groups</span>
                  Network
                </button>
                <button
                  onClick={() => setShowDocuments(!showDocuments)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                    showDocuments 
                      ? 'bg-[#6605c7] text-white shadow-lg' 
                      : 'bg-white border border-gray-100 text-[#6605c7] hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">folder</span>
                  Files ({sharedDocuments.length})
                </button>
                <button
                  onClick={() => setShowEmailNotif(!showEmailNotif)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                    showEmailNotif 
                      ? 'bg-[#5504a6] text-white shadow-lg' 
                      : 'bg-[#6605c7] text-white hover:bg-[#5504a6]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">mail_outline</span>
                  Alert
                </button>
              </div>
            </div>

            {/* Participants Panel */}
            {showParticipants && (
              <div className="p-6 bg-[#fbfbfd] border-b border-gray-200 overflow-y-auto max-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="font-bold text-lg text-gray-900">Conversation Network</h5>
                  <button 
                    onClick={() => setShowParticipants(false)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Admin Panel */}
                  {groupedParticipants.admin.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-red-500">security</span>
                        <p className="font-bold text-sm text-gray-900">Administrators</p>
                      </div>
                      <div className="space-y-3">
                        {groupedParticipants.admin.map((p) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                              {p.fullName.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.fullName}</p>
                              <p className="text-[10px] text-gray-500 truncate">{p.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff Panel */}
                  {groupedParticipants.staff.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-blue-500">support_agent</span>
                        <p className="font-bold text-sm text-gray-900">Support Staff</p>
                      </div>
                      <div className="space-y-3">
                        {groupedParticipants.staff.map((p) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                              {p.fullName.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.fullName}</p>
                              <p className="text-[10px] text-gray-500 truncate">{p.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agent Panel */}
                  {groupedParticipants.agent.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-orange-500">assignment_ind</span>
                        <p className="font-bold text-sm text-gray-900">Assigned Agents</p>
                      </div>
                      <div className="space-y-3">
                        {groupedParticipants.agent.map((p) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                              {p.fullName.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.fullName}</p>
                              <p className="text-[10px] text-gray-500 truncate">{p.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Client/User Panel */}
                  {(groupedParticipants.client.length > 0 || groupedParticipants.others.length > 0) && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-purple-500">person</span>
                        <p className="font-bold text-sm text-gray-900">Clients & Others</p>
                      </div>
                      <div className="space-y-3">
                        {[...groupedParticipants.client, ...groupedParticipants.others].map((p) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                              {p.fullName.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.fullName}</p>
                              <p className="text-[10px] text-gray-500 truncate">{p.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shared Documents Panel */}
            {showDocuments && (
              <div className="p-6 bg-[#fbfbfd] border-b border-gray-200 overflow-y-auto max-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="font-bold text-lg text-gray-900">Shared Documents Repository</h5>
                  <button 
                    onClick={() => setShowDocuments(false)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharedDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-gray-400">description</span>
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-sm text-gray-900 truncate">{doc.documentName}</p>
                          <p className="text-[10px] text-gray-500 mt-1 truncate">
                            {doc.uploaderRole} • {doc.uploadedBy}
                          </p>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#6605c7]/5 text-[#6605c7] rounded-full">
                               {doc.status}
                            </span>
                          </div>
                       </div>
                    </div>
                  ))}
                  {sharedDocuments.length === 0 && (
                    <div className="col-span-full py-10 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                       <span className="material-symbols-outlined text-gray-300 text-4xl">folder_off</span>
                       <p className="text-gray-400 text-sm mt-3">No documents shared in this conversation yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Notification Panel */}
            {showEmailNotif && (
              <div className="p-6 bg-white border-b border-gray-200 shadow-inner">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="font-bold text-lg text-gray-900">Push Email Notification</h5>
                  <button 
                    onClick={() => setShowEmailNotif(false)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Recipient</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">person</span>
                        <select
                          value={selectedEmailRecipient}
                          onChange={(e) => setSelectedEmailRecipient(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 transition-all appearance-none"
                        >
                          <option value="">Select participant...</option>
                          {participants.map((p) => (
                            <option key={p.email} value={p.email}>
                              {p.fullName} ({p.role.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Context / Subject</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 material-symbols-outlined text-gray-400 text-lg">subject</span>
                        <input
                          type="text"
                          placeholder="Application #Ref or Subject"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 transition-all placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <p className="text-xs text-gray-500 mb-4 bg-purple-50 p-3 rounded-xl border border-purple-100 flex gap-2">
                       <span className="material-symbols-outlined text-purple-400 text-sm">info</span>
                       This will alert the selected recipient via their registered email with current conversation context.
                    </p>
                    <button
                      onClick={handleSendEmailNotif}
                      disabled={!selectedEmailRecipient}
                      className="w-full px-6 py-4 bg-[#6605c7] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#6605c7]/20 hover:shadow-xl hover:translate-y-[-1px] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">outgoing_mail</span>
                      Transmit Notification
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-6 bg-slate-50/30">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-600/10 border-t-indigo-600"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encrypting Beam</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-slate-300">
                  <span className="material-symbols-outlined text-6xl mb-4">forum</span>
                  <p className="font-semibold text-lg">No messages in this stack</p>
                  <p className="text-sm">Initiate the secure transmission below</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.email;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-end gap-2 animate-slide-up`}
                    >
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-500 mb-1 ring-4 ring-white shadow-sm">
                          {msg.senderId.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] transition-all duration-200 ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none hover:bg-indigo-700 active:scale-[0.98]'
                            : 'bg-white text-slate-800 border border-gray-100 rounded-bl-none hover:border-indigo-100 active:scale-[0.98]'
                        }`}
                      >
                        {msg.messageType === 'document_share' ? (
                          <div className="flex items-center gap-2">
                             <span className="material-symbols-outlined">attachment</span>
                             <p className="text-[14px] font-medium leading-relaxed">{msg.content}</p>
                          </div>
                        ) : msg.messageType === 'participant_joined' ? (
                          <p className="text-[13px] italic font-medium opacity-80">{msg.content}</p>
                        ) : (
                          <>
                            {!isMe && (
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-[11px] font-extrabold uppercase tracking-tighter text-indigo-500">
                                  {msg.senderType}
                                </p>
                                <span className="text-[10px] text-slate-300">•</span>
                                <p className="text-[11px] font-medium text-slate-400">
                                  {msg.senderId}
                                </p>
                              </div>
                            )}
                            <p className="text-[15px] leading-relaxed break-words font-medium transition-colors">
                              {msg.content}
                            </p>
                          </>
                        )}
                        <div className="flex justify-end items-center gap-2 mt-2 gap-1.5">
                          <p
                            className={`text-[10px] font-bold ${
                              isMe ? 'text-indigo-200/80' : 'text-slate-300'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {isMe && <span className="material-symbols-outlined text-[14px] text-indigo-200/80">done_all</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-4 items-center">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Message the network..."
                    className="w-full pl-6 pr-14 py-4.5 bg-slate-50 border-transparent rounded-[2rem] text-[15px] font-medium focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none placeholder:text-slate-400 box-border"
                    style={{ paddingLeft: '1.5rem', paddingRight: '4rem', paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button type="button" className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                       <span className="material-symbols-outlined">sentiment_satisfied</span>
                    </button>
                    <button type="button" className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                       <span className="material-symbols-outlined">attach_file</span>
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-[60px] h-[60px] bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200/50 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all duration-300 active:scale-95 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-2xl">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
