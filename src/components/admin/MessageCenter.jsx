import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, Send, User, ArrowLeft, ImagePlus, X, Loader2, Mail } from 'lucide-react';

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z'));
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const truncate = (text, maxLen) => {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
};

const StatusBadge = ({ status }) => {
    const config = {
        quote_request: { label: 'Quote', bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-500/30' },
        waiting_payment: { label: 'Payment', bg: 'bg-amber-600/20', text: 'text-amber-400', border: 'border-amber-500/30' },
        shipped_delivered: { label: 'Shipped', bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500/30' },
    };
    const c = config[status] || config.quote_request;
    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.bg} ${c.text} border ${c.border}`}>
            {c.label}
        </span>
    );
};

const MessageCenter = ({ token }) => {
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [threadMessages, setThreadMessages] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const selectedConversation = conversations.find(c => c.order_id === selectedOrderId);

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/admin/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        } finally {
            setLoadingConversations(false);
        }
    };

    // Fetch thread for selected conversation
    const fetchThread = async (orderId) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setThreadMessages(data);
        } catch (err) {
            console.error('Failed to load thread:', err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchConversations();
    }, []);

    // Polling
    useEffect(() => {
        const interval = setInterval(() => {
            fetchConversations();
            if (selectedOrderId) {
                fetchThread(selectedOrderId);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [selectedOrderId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [threadMessages]);

    // Select conversation
    const selectConversation = async (orderId) => {
        setSelectedOrderId(orderId);
        setShowThreadOnMobile(true);
        setLoadingThread(true);
        setNewMessage('');
        clearImage();

        try {
            await fetchThread(orderId);

            // Mark as read
            await fetch(`/api/orders/${orderId}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update local unread count
            setConversations(prev => prev.map(c =>
                c.order_id === orderId ? { ...c, unread_count: 0 } : c
            ));
        } catch (err) {
            console.error('Failed to select conversation:', err);
        } finally {
            setLoadingThread(false);
        }
    };

    // Image handling
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Send message
    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedImage) || !selectedOrderId) return;
        setSendingMessage(true);
        try {
            let image_url = null;
            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);
                const uploadRes = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const uploadData = await uploadRes.json();
                image_url = uploadData.url;
            }

            const res = await fetch(`/api/orders/${selectedOrderId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: newMessage.trim(), sender: 'admin', image_url })
            });
            const savedMsg = await res.json();
            setThreadMessages(prev => [...prev, savedMsg]);
            setNewMessage('');
            clearImage();

            // Update sidebar with new last message
            setConversations(prev => prev.map(c =>
                c.order_id === selectedOrderId
                    ? { ...c, last_message: newMessage.trim() || (image_url ? '' : ''), last_sender: 'admin', last_message_at: new Date().toISOString(), total_messages: c.total_messages + 1 }
                    : c
            ).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)));
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSendingMessage(false);
        }
    };

    // Search filter
    const filteredConversations = conversations.filter(c => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            c.customer_name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.order_id.toLowerCase().includes(q) ||
            (c.last_message && c.last_message.toLowerCase().includes(q))
        );
    });

    return (
        <div className="bg-gray-950/50 backdrop-blur-2xl rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex h-[calc(100vh-240px)] min-h-[500px]">

                {/* LEFT PANEL: Conversation List */}
                <div className={`w-[350px] flex-shrink-0 border-r border-white/5 flex flex-col ${showThreadOnMobile ? 'max-md:hidden' : ''} max-md:w-full`}>
                    {/* Search */}
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loadingConversations ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="animate-spin text-purple-500" size={24} />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <MessageCircle size={40} className="text-gray-700 mb-3" />
                                <p className="text-xs font-black uppercase tracking-widest">
                                    {searchQuery ? 'No results' : 'No conversations yet'}
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <div
                                    key={conv.order_id}
                                    onClick={() => selectConversation(conv.order_id)}
                                    className={`px-5 py-4 cursor-pointer border-b border-white/5 hover:bg-white/5 transition-all duration-150 ${
                                        selectedOrderId === conv.order_id
                                            ? 'bg-purple-600/10 border-l-2 border-l-purple-500'
                                            : 'border-l-2 border-l-transparent'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-black text-white text-sm truncate flex-1 mr-2">{conv.customer_name}</span>
                                        <span className="text-[9px] text-gray-500 whitespace-nowrap font-mono">
                                            {formatRelativeTime(conv.last_message_at || conv.order_created_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-400 truncate flex-1 mr-2">
                                            {conv.total_messages === 0
                                                ? <span className="text-gray-600 italic">New quote — no messages yet</span>
                                                : <>
                                                    {conv.last_sender === 'admin' ? <span className="text-gray-500">You: </span> : ''}
                                                    {conv.last_image_url && !conv.last_message ? '📷 Image' : truncate(conv.last_message, 45)}
                                                </>
                                            }
                                        </p>
                                        {conv.unread_count > 0 && (
                                            <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <StatusBadge status={conv.status} />
                                        <span className="text-[9px] text-gray-600 font-mono">#{conv.order_id.replace('quote_', '')}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Message Thread */}
                <div className={`flex-1 flex flex-col ${!showThreadOnMobile ? 'max-md:hidden' : ''}`}>
                    {!selectedOrderId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <MessageCircle size={64} className="text-gray-800 mb-4" />
                            <p className="font-black uppercase tracking-widest text-[10px] text-gray-600">Select a conversation</p>
                        </div>
                    ) : (
                        <>
                            {/* Thread Header */}
                            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4 bg-gray-950/50">
                                <button
                                    onClick={() => { setShowThreadOnMobile(false); setSelectedOrderId(null); }}
                                    className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size={18} className="text-gray-400" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-0.5">
                                        <h3 className="font-black text-white text-lg truncate">{selectedConversation?.customer_name}</h3>
                                        <StatusBadge status={selectedConversation?.status} />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Mail size={10} />
                                        <span className="truncate">{selectedConversation?.email}</span>
                                        <span className="text-gray-700">·</span>
                                        <span className="font-mono">#{selectedOrderId.replace('quote_', '')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {loadingThread ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="animate-spin text-purple-500" size={24} />
                                    </div>
                                ) : threadMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <MessageCircle size={40} className="text-gray-700 mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-600">No messages yet</p>
                                    </div>
                                ) : (
                                    threadMessages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                                                msg.sender === 'admin'
                                                    ? 'bg-purple-600/20 border border-purple-500/20'
                                                    : 'bg-white/5 border border-white/10'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <User size={10} className={msg.sender === 'admin' ? 'text-purple-400' : 'text-gray-400'} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                        {msg.sender === 'admin' ? 'Admin' : 'Customer'}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500">
                                                        {new Date(msg.created_at + (msg.created_at.includes('Z') ? '' : 'Z')).toLocaleString(undefined, {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {msg.message && (
                                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                                        msg.sender === 'admin' ? 'text-purple-200' : 'text-gray-300'
                                                    }`}>
                                                        {msg.message}
                                                    </p>
                                                )}
                                                {msg.image_url && (
                                                    <div className="mt-2">
                                                        <img
                                                            src={msg.image_url}
                                                            alt="Attachment"
                                                            className="max-w-full max-h-48 rounded-xl border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => window.open(msg.image_url, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="px-6 py-2 border-t border-white/5 bg-gray-950/30">
                                    <div className="relative inline-block">
                                        <img src={imagePreview} alt="Preview" className="h-20 rounded-xl border border-white/10" />
                                        <button
                                            onClick={clearImage}
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 hover:bg-red-400 transition-colors"
                                        >
                                            <X size={12} className="text-white" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Input Bar */}
                            <div className="px-6 py-4 border-t border-white/5 bg-gray-950/50">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors flex-shrink-0"
                                    >
                                        <ImagePlus size={18} className="text-gray-400" />
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition-colors"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sendingMessage || (!newMessage.trim() && !selectedImage)}
                                        className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-colors flex items-center gap-2 flex-shrink-0"
                                    >
                                        {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageCenter;
