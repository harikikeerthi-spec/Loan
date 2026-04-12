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
  role: 'staff' | 'bank'; // What dashboard is this embedded in
}

export default function ChatInterface({ role }: ChatInterfaceProps) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Socket Connection
  useEffect(() => {
    if (!token) return;

    // Load initial conversations manually
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data: Conversation[] = await res.json();
        if (Array.isArray(data)) setConversations(data);
      } catch (e) {
        console.error("Failed to load conversations", e);
      }
    };
    
    fetchConversations();

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/chat', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log(`Connected to chat socket as ${role}`);
    });

    socketInstance.on('user_activity', (data: any) => {
        // Simple toast or log for new user login/registration
        console.log("Activity detected:", data);
        // We could also re-fetch conversations here if it's a new registration
        fetchConversations();
    });

    socketInstance.on('conversation_updated', (data: { conversationId: string, lastMessage: Message }) => {
       // Update conversation list with new last message and bump to top
       setConversations(prev => {
          const exists = prev.find(c => c.id === data.conversationId);
          if (exists) {
              const updated = prev.filter(c => c.id !== data.conversationId);
              return [{...exists, lastMessage: data.lastMessage, updatedAt: data.lastMessage.createdAt}, ...updated];
          } else {
              // Fetch conversations again to get the full object
              fetchConversations();
              return prev;
          }
       });
    });

    socketInstance.on('new_message', (msg: Message) => {
        setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
        });
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
         
         // Mock fetch initial messages (Ideally this is a REST call to `GET /chat/messages/:id`)
         fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chat/messages/${activeConversation}`, {
             headers: { Authorization: `Bearer ${token}` }
         })
         .then(res => res.json())
         .then(data => {
            if (Array.isArray(data)) setMessages(data);
            scrollToBottom();
         }).catch(e => console.error("Could not load messages. Make sure you hook up the REST endpoint."));

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

  return (
    <div className="flex h-[800px] border border-white/5 rounded-[2.5rem] overflow-hidden bg-[#0a0c12] shadow-2xl mt-6 animate-fade-in text-white/90">
      
      {/* Sidebar: Conversations */}
      <div className="w-80 border-r border-white/5 bg-[#0f172a] flex flex-col">
          <div className="p-8 border-b border-white/5 bg-[#0f172a]">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-xl tracking-tighter italic">CONVERSATIONS</h3>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center animate-spin-slow">
                      <span className="material-symbols-outlined text-sm font-black">sync</span>
                  </div>
              </div>
              <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
                  <input 
                    type="text" 
                    placeholder="Search transmissions..." 
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
              </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-2">
              {conversations.length === 0 ? (
                  <div className="p-10 text-center opacity-30">
                      <div className="w-16 h-16 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <span className="material-symbols-outlined text-3xl">sensors_off</span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Silence on wire</p>
                  </div>
              ) : (
                  conversations.map(conv => (
                      <div 
                        key={conv.id} 
                        onClick={() => setActiveConversation(conv.id)}
                        className={`px-6 py-5 cursor-pointer transition-all relative rounded-3xl group
                                  ${activeConversation === conv.id ? 'bg-indigo-600 shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5'}`}
                      >
                          <div className="flex justify-between items-start mb-2">
                              {/* Avatar placeholder from screenshot */}
                              <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${activeConversation === conv.id ? 'bg-white/20' : 'bg-indigo-600 shadow-lg'}`}>
                                      {(conv.customerName || conv.customerPhone)?.substring(0, 1)}
                                  </div>
                                  <div className="min-w-0">
                                      <span className={`font-black text-sm tracking-tight truncate block ${activeConversation === conv.id ? 'text-white' : 'text-gray-200'}`}>
                                        {conv.customerName || conv.customerPhone}
                                      </span>
                                      <span className={`text-[8px] font-black uppercase tracking-widest block mt-0.5 ${activeConversation === conv.id ? 'text-white/60' : 'text-gray-500'}`}>
                                          Active Node
                                      </span>
                                  </div>
                              </div>
                              <span className={`text-[9px] font-black uppercase opacity-60 ${activeConversation === conv.id ? 'text-white' : 'text-gray-400'}`}>
                                  {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                              </span>
                          </div>
                          
                          <div className="text-[11px] font-medium opacity-70 truncate px-1">
                                {conv.lastMessage ? conv.lastMessage.content : 'Syncing initialization...'}
                          </div>

                          {conv.status === 'active' && activeConversation !== conv.id && (
                                <div className="absolute right-6 bottom-6 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                          )}
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#05070a]">
          {activeConversation ? (
              <>
                  {/* Chat Header */}
                  <div className="p-8 bg-[#0d1117] border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-600/30 border border-white/10">
                                    {(conversations.find(c => c.id === activeConversation)?.customerName || conversations.find(c => c.id === activeConversation)?.customerPhone)?.substring(0, 1)}
                                </div>
                                <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-emerald-500 border-4 border-[#0d1117] rounded-full"></div>
                            </div>
                          <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-black text-2xl tracking-tighter italic">
                                    {conversations.find(c => c.id === activeConversation)?.customerName || conversations.find(c => c.id === activeConversation)?.customerPhone}
                                </h4>
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-500/20">
                                    {conversations.find(c => c.id === activeConversation)?.customerEmail || 'Student Applicant'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 px-0.5">
                                  <div className="flex items-center gap-1.5 py-0.5 px-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">WhatsApp Bridge Secured</span>
                                  </div>
                                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">Latency: 24ms</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-4">
                        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 group">
                           <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">folder_open</span>
                           Documents Node
                        </button>
                      </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-10 overflow-y-auto no-scrollbar flex flex-col gap-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-[#05070a]/50">
                      <div className="flex justify-center mb-6">
                          <span className="px-4 py-1 bg-white/5 border border-white/5 text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] rounded-full backdrop-blur-md">
                              Transmissions Sync · Today
                          </span>
                      </div>
                      
                      {messages.map(msg => {
                          const isMe = msg.senderType === role;
                          const isCustomer = msg.senderType === 'customer';
                          
                          return (
                              <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'} animate-slide-up`}>
                                  {/* Label & Status */}
                                  <div className="flex items-center gap-3 mb-2 px-1">
                                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isMe ? 'text-indigo-400' : 'text-gray-500'}`}>
                                          {isMe ? 'STAFF OPERATOR' : 'CLIENT NODE'}
                                      </span>
                                      {isCustomer && (
                                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                                              <span className="w-1 h-1 rounded-full bg-[#25D366]"></span>
                                              <span className="text-[8px] text-[#25D366] font-black uppercase tracking-widest">WhatsApp</span>
                                          </div>
                                      )}
                                  </div>

                                  <div className={`p-5 rounded-[2rem] shadow-2xl relative border ${
                                        isMe 
                                        ? 'bg-indigo-600 text-white rounded-tr-none border-white/10' 
                                        : isCustomer 
                                            ? 'bg-[#12181f]/80 backdrop-blur-md border-white/5 text-gray-200 rounded-tl-none' 
                                            : 'bg-emerald-600 text-white rounded-tl-none border-white/10'
                                     }`}>
                                      <p className="text-sm font-medium leading-relaxed tracking-tight">{msg.content}</p>
                                  </div>
                                  
                                  <div className={`mt-3 flex items-center gap-3 px-1 text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-indigo-400/50' : 'text-gray-600'}`}>
                                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      {isMe && (
                                          <div className="flex items-center gap-1.5">
                                              <span className="material-symbols-outlined text-[10px]">done_all</span>
                                              <span>Synced to Cloud</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )
                      })}
                      <div ref={messagesEndRef} />
                  </div>

                  {/* Input Panel */}
                  <div className="p-8 bg-[#0d1117] border-t border-white/5">
                      <form onSubmit={handleSendMessage} className="flex gap-6 items-center">
                          <button type="button" className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-gray-500 transition-all border border-white/5">
                             <span className="material-symbols-outlined font-black">add</span>
                          </button>
                          <div className="flex-1 relative">
                              <input 
                                  type="text" 
                                  value={inputText}
                                  onChange={(e) => setInputText(e.target.value)}
                                  placeholder="Type signal to transmit via WhatsApp Bridge..."
                                  className="w-full bg-[#161b22] border border-white/10 rounded-2xl px-8 py-5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium"
                              />
                          </div>
                          <button 
                             type="submit"
                             disabled={!inputText.trim()}
                             className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-20 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 group"
                          >
                             <span className="material-symbols-outlined font-black group-hover:rotate-12 transition-transform">send</span>
                          </button>
                      </form>
                      <div className="flex justify-between items-center mt-6 px-1">
                          <div className="flex items-center gap-3 opacity-20">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                             <span className="text-[9px] font-black uppercase tracking-[0.3em]">Protocol.V3 Secure</span>
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">Press ENTER to transmit signal</p>
                      </div>
                  </div>
              </>
          ) : (
              <div className="flex-1 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent"></div>
                  <div className="text-center relative z-10 animate-fade-in">
                      <div className="w-32 h-32 rounded-[3.5rem] bg-indigo-600/10 text-indigo-500 flex items-center justify-center mx-auto mb-10 shadow-3xl border border-indigo-500/10 relative">
                        <div className="absolute inset-0 rounded-[3.5rem] animate-ping-slow bg-indigo-500/5"></div>
                        <span className="material-symbols-outlined text-6xl">leak_add</span>
                      </div>
                      <h3 className="text-4xl font-black tracking-tighter italic mb-4">NODE AGGREGATOR</h3>
                      <p className="text-gray-600 font-bold uppercase text-[10px] tracking-[0.5em]">Synchronizing Multi-Channel Transmissions</p>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}
