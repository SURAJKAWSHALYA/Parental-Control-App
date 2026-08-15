import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Send, Image as ImageIcon, Video, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';
import MediaViewer from './MediaViewer';

export default function FamilyChat({ selectedDevice, deviceStatus }: { selectedDevice: string, deviceStatus?: string }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSender, setFilterSender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{ id: string, type: 'IMAGE' | 'VIDEO' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id, true);
    }
  }, [activeConversation, searchQuery, filterSender, filterStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherTyping]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: any) => {
      if (activeConversation && message.conversationId === activeConversation._id) {
        setMessages(prev => {
          // Dedup check
          if (prev.find(m => m._id === message._id || m.clientMessageId === message.clientMessageId)) return prev;
          return [...prev, message];
        });
        
        // Auto-mark as read if we are looking at the chat
        if (message.senderType === 'Child') {
          api.put(`/chat/messages/${message._id}/read`).catch(console.error);
        } else {
           // We sent it, update status locally if needed
        }
      }
    };

    const handleTyping = (data: any) => {
      if (activeConversation && data.conversationId === activeConversation._id) {
        setOtherTyping(true);
      }
    };

    const handleStopTyping = (data: any) => {
      if (activeConversation && data.conversationId === activeConversation._id) {
        setOtherTyping(false);
      }
    };

    const handleRead = (data: any) => {
       if (activeConversation && data.conversationId === activeConversation._id) {
         setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, status: 'READ' } : m));
       }
    };

    const handleDelivered = (data: any) => {
       if (activeConversation && data.conversationId === activeConversation._id) {
         setMessages(prev => prev.map(m => m._id === data.messageId && m.status !== 'READ' ? { ...m, status: 'DELIVERED' } : m));
       }
    };

    const handleDeleted = (data: any) => {
       if (activeConversation && data.conversationId === activeConversation._id) {
         setMessages(prev => prev.filter(m => m._id !== data.messageId));
       }
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stopTyping', handleStopTyping);
    socket.on('chat:message:read', handleRead);
    socket.on('chat:message:delivered', handleDelivered);
    socket.on('chat:message:deleted', handleDeleted);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stopTyping', handleStopTyping);
      socket.off('chat:message:read', handleRead);
      socket.off('chat:message:delivered', handleDelivered);
      socket.off('chat:message:deleted', handleDeleted);
    };
  }, [socket, activeConversation]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
        if (res.data.data.length > 0) {
          setActiveConversation(res.data.data[0]);
        } else if (selectedDevice) {
           // Try to create conversation if one doesn't exist for selected device
           // Need childId which we might have to fetch or pass
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const fetchMessages = async (conversationId: string, reset = false) => {
    if (reset) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingOlder(true);
    }
    
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      
      if (searchQuery) params.append('search', searchQuery);
      if (filterSender) params.append('senderType', filterSender);
      if (filterStatus) params.append('safetyStatus', filterStatus);
      
      if (!reset && messages.length > 0) {
        params.append('cursor', messages[0].createdAt);
        params.append('direction', 'older');
      }

      const res = await api.get(`/chat/${conversationId}/messages?${params.toString()}`);
      if (res.data.success) {
        const fetched = res.data.data.reverse();
        if (fetched.length < 50) setHasMore(false);
        
        if (reset) {
          setMessages(fetched);
        } else {
          setMessages(prev => [...fetched, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
      setLoadingOlder(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (!isTyping && activeConversation) {
      setIsTyping(true);
      socket?.emit('chat:typing', { 
        conversationId: activeConversation._id, 
        receiverId: activeConversation.childId?._id || activeConversation.childId 
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (activeConversation) {
        socket?.emit('chat:stopTyping', { 
          conversationId: activeConversation._id, 
          receiverId: activeConversation.childId?._id || activeConversation.childId 
        });
      }
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    const tempId = `temp_${Date.now()}`;
    const textToSend = inputText;
    setInputText('');
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    socket?.emit('chat:stopTyping', { 
      conversationId: activeConversation._id, 
      receiverId: activeConversation.childId?._id || activeConversation.childId 
    });

    // Optimistic UI
    const tempMsg = {
      _id: tempId,
      clientMessageId: tempId,
      text: textToSend,
      senderType: 'Parent',
      status: 'SENDING',
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.post(`/chat/${activeConversation._id}/messages`, {
        text: textToSend,
        clientMessageId: tempId,
        messageType: 'TEXT'
      });
      
      if (res.data.success) {
        setMessages(prev => prev.map(m => m._id === tempId ? res.data.data : m));
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'FAILED' } : m));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      alert('Only images and videos are supported.');
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      alert('Image exceeds 10MB limit.');
      return;
    }
    
    if (isVideo && file.size > 100 * 1024 * 1024) {
      alert('Video exceeds 100MB limit.');
      return;
    }

    setUploadProgress(0);

    const formData = new FormData();
    formData.append('media', file);
    formData.append('conversationId', activeConversation._id);
    formData.append('senderType', 'Parent');

    try {
      // 1. Upload Media
      const uploadRes = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(percentCompleted);
        }
      });

      if (uploadRes.data.success) {
        const mediaId = uploadRes.data.data._id;
        
        // 2. Send Message
        const tempId = `temp_media_${Date.now()}`;
        const tempMsg = {
          _id: tempId,
          clientMessageId: tempId,
          text: isImage ? 'Sent a photo' : 'Sent a video',
          senderType: 'Parent',
          messageType: isImage ? 'IMAGE' : 'VIDEO',
          mediaId,
          status: 'SENDING',
          createdAt: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, tempMsg]);

        const msgRes = await api.post(`/chat/${activeConversation._id}/messages`, {
          text: tempMsg.text,
          clientMessageId: tempId,
          messageType: tempMsg.messageType,
          mediaId: mediaId
        });
        
        if (msgRes.data.success) {
          setMessages(prev => prev.map(m => m._id === tempId ? msgRes.data.data : m));
        }
      }
    } catch (err: any) {
      console.error('Media upload failed', err);
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadProgress(null);
    }
  };

  const renderStatus = (status: string) => {
    switch(status) {
      case 'SENDING': return <span className="text-neutral-500 text-[10px]">Sending...</span>;
      case 'SENT': return <Check className="w-3 h-3 text-neutral-400" />;
      case 'DELIVERED': return <CheckCheck className="w-3 h-3 text-neutral-400" />;
      case 'READ': return <CheckCheck className="w-3 h-3 text-emerald-400" />;
      case 'FAILED': return <span className="text-red-500 text-[10px]">Failed</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-800/30 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2">
            Family Chat
            {deviceStatus === 'online' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </h2>
          {activeConversation && (
            <p className="text-xs text-neutral-400">
              Chatting with {activeConversation.childId?.name || 'Child'}
            </p>
          )}
        </div>
        <div className="text-xs text-neutral-500">
          {deviceStatus === 'online' ? '🟢 Online' : '⚪ Offline'}
        </div>
      </div>

      {/* Filters & Search */}
      {activeConversation && (
        <div className="p-2 border-b border-neutral-800 bg-neutral-900 flex flex-wrap gap-2 text-sm">
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-neutral-800 text-white px-3 py-1.5 rounded-lg border border-neutral-700 flex-1 min-w-[150px] focus:outline-none focus:border-emerald-500"
          />
          <select 
            value={filterSender} 
            onChange={(e) => setFilterSender(e.target.value)}
            className="bg-neutral-800 text-white px-3 py-1.5 rounded-lg border border-neutral-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Senders</option>
            <option value="Parent">Parent</option>
            <option value="Child">Child</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-neutral-800 text-white px-3 py-1.5 rounded-lg border border-neutral-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Status</option>
            <option value="SAFE">Safe</option>
            <option value="FLAGGED">Flagged</option>
          </select>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {hasMore && !loading && messages.length > 0 && (
          <div className="flex justify-center mb-4">
            <button 
              onClick={() => fetchMessages(activeConversation._id, false)}
              disabled={loadingOlder}
              className="text-xs text-neutral-400 hover:text-white px-4 py-1.5 bg-neutral-800 rounded-full transition-colors flex items-center gap-2"
            >
              {loadingOlder ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Load Older Messages'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-full">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <p>No messages found.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isParent = msg.senderType === 'Parent';
            return (
              <div key={msg._id || index} className={`flex ${isParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isParent 
                    ? 'bg-emerald-600 text-white rounded-br-none' 
                    : 'bg-neutral-800 text-neutral-100 rounded-bl-none'
                }`}>
                  {msg.messageType === 'IMAGE' || msg.messageType === 'VIDEO' ? (
                    <div 
                      className="cursor-pointer mb-2 flex flex-col items-center justify-center p-4 bg-black/20 rounded-lg min-w-[120px]"
                      onClick={() => msg.mediaId && setViewingMedia({ id: msg.mediaId, type: msg.messageType })}
                    >
                      {msg.messageType === 'VIDEO' ? <Video className="w-8 h-8 mb-2 opacity-80" /> : <ImageIcon className="w-8 h-8 mb-2 opacity-80" />}
                      <span className="text-xs font-medium uppercase tracking-wider opacity-80">View {msg.messageType}</span>
                    </div>
                  ) : (
                    <p className="break-words">{msg.text}</p>
                  )}
                  <div className={`flex items-center gap-1 mt-1 text-[10px] ${isParent ? 'text-emerald-200 justify-end' : 'text-neutral-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isParent && renderStatus(msg.status)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 text-neutral-400 rounded-2xl rounded-bl-none px-4 py-2 text-sm flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-3 bg-neutral-800/50 border-t border-neutral-800 relative">
        {uploadProgress !== null && (
          <div className="absolute top-0 left-0 right-0 -mt-8 px-4 flex items-center justify-between text-xs text-neutral-400 bg-neutral-900/90 py-1.5 border-y border-neutral-800">
            <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Uploading media...</span>
            <div className="flex-1 max-w-[200px] ml-4 bg-neutral-800 rounded-full h-1.5">
               <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="ml-2 font-medium">{uploadProgress}%</span>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*,video/*" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
             <Paperclip className="w-5 h-5" />
          </button>
          
          <input 
            type="text" 
            value={inputText}
            onChange={handleTextChange}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-900 border border-neutral-700 text-white rounded-full px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            disabled={!activeConversation}
          />
          
          <button 
            type="submit" 
            disabled={!inputText.trim() || !activeConversation}
            className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {viewingMedia && (
        <MediaViewer 
          mediaId={viewingMedia.id}
          type={viewingMedia.type}
          onClose={() => setViewingMedia(null)}
        />
      )}
    </div>
  );
}
