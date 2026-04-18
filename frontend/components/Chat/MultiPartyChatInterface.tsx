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
    return () => socketInstance.disconnect();
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
    <div className="flex h-[800px] border border-gray-200 rounded-[2.5rem] overflow-hidden bg-white shadow-2xl animate-fade-in text-gray-900">
      {/* Sidebar: Conversations */}
      <div className="w-80 border-r border-gray-200 bg-[#fbfbfd] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold text-xl text-gray-900">Communication Hub</h3>
          <p className="text-xs text-gray-500 mt-1">Multi-party conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${
                activeConversation === conv.id
                  ? 'bg-[#6605c7] text-white'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <p
                className={`font-bold text-sm ${
                  activeConversation === conv.id ? 'text-white' : 'text-gray-900'
                }`}
              >
                {conv.conversationTopic}
              </p>
              <p
                className={`text-xs mt-1 ${
                  activeConversation === conv.id ? 'text-white/80' : 'text-gray-500'
                }`}
              >
                {conv.isMultiParty ? `👥 ${participants.length} participants` : 'Direct chat'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {activeConversation && currentConversation ? (
          <>
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#6605c7]/10 to-[#5504a6]/5 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-lg text-gray-900">{currentConversation.conversationTopic}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {currentConversation.isMultiParty
                    ? `${participants.length} participants • Multi-party conversation`
                    : 'Direct message'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#6605c7] hover:bg-gray-50"
                >
                  👥 Participants
                </button>
                <button
                  onClick={() => setShowDocuments(!showDocuments)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#6605c7] hover:bg-gray-50"
                >
                  📄 Docs ({sharedDocuments.length})
                </button>
                <button
                  onClick={() => setShowEmailNotif(!showEmailNotif)}
                  className="px-4 py-2 bg-[#6605c7] text-white rounded-lg text-xs font-bold hover:bg-[#5504a6]"
                >
                  ✉️ Email
                </button>
              </div>
            </div>

            {/* Participants Panel */}
            {showParticipants && (
              <div className="p-4 bg-blue-50/50 border-b border-gray-200 max-h-48 overflow-y-auto">
                <p className="font-bold text-sm mb-3 text-gray-900">Conversation Participants</p>
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">{p.fullName}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 bg-[#6605c7]/10 text-[#6605c7] rounded">
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Documents Panel */}
            {showDocuments && (
              <div className="p-4 bg-green-50/50 border-b border-gray-200 max-h-48 overflow-y-auto">
                <p className="font-bold text-sm mb-3 text-gray-900">Shared Documents</p>
                <div className="space-y-2">
                  {sharedDocuments.map((doc) => (
                    <div key={doc.id} className="p-2 bg-white rounded border border-gray-200">
                      <p className="text-sm font-bold text-gray-900">📄 {doc.documentName}</p>
                      <p className="text-xs text-gray-500">
                        Shared by {doc.uploadedBy} ({doc.uploaderRole})
                      </p>
                      <p className="text-xs text-[#6605c7] font-bold mt-1">Status: {doc.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Notification Panel */}
            {showEmailNotif && (
              <div className="p-4 bg-purple-50/50 border-b border-gray-200">
                <p className="font-bold text-sm mb-3 text-gray-900">Send Email Notification</p>
                <div className="space-y-3">
                  <select
                    value={selectedEmailRecipient}
                    onChange={(e) => setSelectedEmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                  >
                    <option value="">Select recipient...</option>
                    {participants.map((p) => (
                      <option key={p.email} value={p.email}>
                        {p.fullName} ({p.email}) - {p.role}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Email subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                  />

                  <button
                    onClick={handleSendEmailNotif}
                    className="w-full px-4 py-2 bg-[#6605c7] text-white rounded text-sm font-bold hover:bg-[#5504a6]"
                  >
                    Send Email Notification
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-4 bg-gradient-to-b from-[#fbfbfd] to-white">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#6605c7]"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.email;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}
                    >
                      <div
                        className={`max-w-[65%] p-4 rounded-[1.5rem] shadow-lg ${
                          isMe
                            ? 'bg-[#6605c7] text-white rounded-tr-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        {msg.messageType === 'document_share' ? (
                          <p className="text-sm">📄 {msg.content}</p>
                        ) : msg.messageType === 'participant_joined' ? (
                          <p className="text-sm italic">{msg.content}</p>
                        ) : (
                          <>
                            {!isMe && (
                              <p className={`text-xs font-bold mb-1 ${isMe ? 'text-white/80' : 'text-gray-500'}`}>
                                {msg.senderId} ({msg.senderType})
                              </p>
                            )}
                            <p className="text-sm break-words">{msg.content}</p>
                          </>
                        )}
                        <p
                          className={`text-xs mt-2 ${
                            isMe ? 'text-white/70' : 'text-gray-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-12 h-12 bg-[#6605c7] text-white rounded-full flex items-center justify-center hover:bg-[#5504a6] disabled:opacity-50 transition-all"
                >
                  <span className="material-symbols-outlined">send</span>
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
