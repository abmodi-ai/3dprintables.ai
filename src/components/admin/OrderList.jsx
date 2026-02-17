import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Package, Send, CreditCard, Truck, MessageCircle, ChevronDown, ChevronUp, Clock, User, Mail, ImagePlus, X, Search, XCircle, Ban } from 'lucide-react';

const STATUS_STEPS = [
    { key: 'quote_request', label: 'Quote Request', icon: Send, color: 'purple' },
    { key: 'waiting_payment', label: 'Waiting for Payment', icon: CreditCard, color: 'amber' },
    { key: 'shipped_delivered', label: 'Shipped & Delivered', icon: Truck, color: 'green' },
];

const STATUS_INDEX = { quote_request: 0, waiting_payment: 1, shipped_delivered: 2, cancelled: -1 };

const ALL_STATUSES = [
    { key: 'all', label: 'All' },
    { key: 'quote_request', label: 'Quote Request' },
    { key: 'waiting_payment', label: 'Waiting Payment' },
    { key: 'shipped_delivered', label: 'Shipped' },
    { key: 'cancelled', label: 'Cancelled' },
];

const OrderList = ({ orders, isLoadingOrders, token, onOrderCancelled }) => {
    const [orderStatuses, setOrderStatuses] = useState({});
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [messages, setMessages] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [logReplyText, setLogReplyText] = useState('');
    const [showLogReply, setShowLogReply] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [cancellingOrder, setCancellingOrder] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize local statuses from orders
    useEffect(() => {
        const statuses = {};
        orders.forEach(order => {
            statuses[order.id] = order.status || 'quote_request';
        });
        setOrderStatuses(statuses);
    }, [orders]);

    // Fetch messages when expanding an order
    useEffect(() => {
        if (expandedOrder && !messages[expandedOrder]) {
            fetchMessages(expandedOrder);
        }
    }, [expandedOrder]);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, expandedOrder]);

    const fetchMessages = async (orderId) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setMessages(prev => ({ ...prev, [orderId]: data }));
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        if (updatingStatus) return;
        const currentStatus = orderStatuses[orderId] || 'quote_request';
        if (currentStatus === newStatus) return;

        setUpdatingStatus(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setOrderStatuses(prev => ({ ...prev, [orderId]: newStatus }));
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setUpdatingStatus(null);
        }
    };

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

    const handleSendMessage = async (orderId) => {
        if ((!newMessage.trim() && !selectedImage) || sendingMessage) return;
        setSendingMessage(true);
        try {
            let imageUrl = null;

            // Upload image first if selected
            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);
                const uploadRes = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url;
                } else {
                    console.error('Image upload failed');
                    setSendingMessage(false);
                    return;
                }
            }

            const res = await fetch(`/api/orders/${orderId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: newMessage.trim(), sender: 'admin', image_url: imageUrl }),
            });
            if (res.ok) {
                const saved = await res.json();
                setMessages(prev => ({
                    ...prev,
                    [orderId]: [...(prev[orderId] || []), saved],
                }));
                setNewMessage('');
                clearImage();
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleLogReply = async (orderId) => {
        if (!logReplyText.trim() || sendingMessage) return;
        setSendingMessage(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: logReplyText.trim(), sender: 'customer' }),
            });
            if (res.ok) {
                const saved = await res.json();
                setMessages(prev => ({
                    ...prev,
                    [orderId]: [...(prev[orderId] || []), saved],
                }));
                setLogReplyText('');
                setShowLogReply(null);
            }
        } catch (err) {
            console.error('Failed to log reply:', err);
        } finally {
            setSendingMessage(false);
        }
    };

    const getStatusIndex = (orderId) => {
        const status = orderStatuses[orderId] || 'quote_request';
        return STATUS_INDEX[status] ?? 0;
    };

    const handleCancelOrder = async (orderId) => {
        if (!confirm('Are you sure you want to cancel this order? The customer will be notified via email.')) return;
        setCancellingOrder(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'cancelled' }),
            });
            if (res.ok) {
                setOrderStatuses(prev => ({ ...prev, [orderId]: 'cancelled' }));
            }
        } catch (err) {
            console.error('Failed to cancel order:', err);
        } finally {
            setCancellingOrder(null);
        }
    };

    // Filter and search orders
    const filteredOrders = orders.filter(order => {
        const status = orderStatuses[order.id] || order.status || 'quote_request';
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                order.customer_name.toLowerCase().includes(q) ||
                order.email.toLowerCase().includes(q) ||
                order.id.toLowerCase().includes(q) ||
                (order.phone && order.phone.toLowerCase().includes(q))
            );
        }
        return true;
    });

    const orderMsgCount = (orderId) => {
        if (messages[orderId]) return messages[orderId].length;
        const order = orders.find(o => o.id === orderId);
        return order?.messageCount || 0;
    };

    return (
        <div className="space-y-10 animate-fadeIn max-w-4xl mx-auto">
            {isLoadingOrders ? (
                <div className="flex flex-col items-center py-32 text-gray-400">
                    <Loader2 className="animate-spin mb-6 text-purple-500" size={64} />
                    <p className="font-black uppercase tracking-[0.4em] text-xs">Loading Orders...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white/5 p-32 rounded-[4rem] border border-dashed border-white/5 text-center shadow-inner">
                    <Package className="mx-auto text-gray-600 mb-6" size={80} />
                    <h3 className="text-3xl font-black text-gray-400 uppercase tracking-tighter">No Orders Yet</h3>
                </div>
            ) : (
                <>
                {/* Search & Filter Bar */}
                <div className="bg-gray-950/50 backdrop-blur-2xl rounded-[2rem] border border-white/5 p-6 space-y-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone, or order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ALL_STATUSES.map(s => (
                            <button
                                key={s.key}
                                onClick={() => setStatusFilter(s.key)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                                    statusFilter === s.key
                                        ? 'bg-purple-600 text-white border-purple-500'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30 hover:text-gray-300'
                                }`}
                            >
                                {s.label}
                                {s.key !== 'all' && (
                                    <span className="ml-1.5 opacity-60">
                                        {orders.filter(o => (orderStatuses[o.id] || o.status || 'quote_request') === s.key).length}
                                    </span>
                                )}
                                {s.key === 'all' && <span className="ml-1.5 opacity-60">{orders.length}</span>}
                            </button>
                        ))}
                    </div>
                    {(searchQuery || statusFilter !== 'all') && (
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </p>
                    )}
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-white/5 p-20 rounded-[4rem] border border-dashed border-white/5 text-center shadow-inner">
                        <Search className="mx-auto text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">No matching orders</h3>
                        <p className="text-xs text-gray-500 mt-2">Try adjusting your search or filter</p>
                    </div>
                ) : (
                filteredOrders.map(order => {
                    const currentIdx = getStatusIndex(order.id);
                    const isExpanded = expandedOrder === order.id;
                    const msgCount = orderMsgCount(order.id);

                    return (
                        <div key={order.id} className="bg-gray-950/50 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden group hover:border-purple-500/30 transition-all duration-700">
                            <div className="p-10">
                                {/* Header */}
                                <div className="flex flex-col md:flex-row justify-between gap-10 mb-10 pb-10 border-b border-white/5">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-purple-500/20">Order</span>
                                            <span className="text-gray-500 font-mono text-sm font-bold">#{order.id.split('_')[1]}</span>
                                        </div>
                                        <h3 className="text-4xl font-black text-white tracking-tighter">{order.customer_name}</h3>
                                        <div className="flex flex-wrap gap-6 text-xs font-black uppercase tracking-widest text-gray-400">
                                            <span className="flex items-center gap-2"><span className="text-purple-500">Email:</span> {order.email}</span>
                                            <span className="flex items-center gap-2"><span className="text-purple-500">Phone:</span> {order.phone}</span>
                                        </div>
                                    </div>
                                    <div className="text-right md:min-w-[200px]">
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Transaction Value</div>
                                        <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">${order.total.toFixed(2)}</div>
                                        <div className="text-[10px] font-black text-gray-500 mt-3 uppercase tracking-widest">{new Date(order.created_at).toLocaleString()}</div>
                                        {(orderStatuses[order.id] || order.status) !== 'cancelled' && (orderStatuses[order.id] || order.status) !== 'shipped_delivered' && (
                                            <button
                                                onClick={() => handleCancelOrder(order.id)}
                                                disabled={cancellingOrder === order.id}
                                                className="mt-3 px-4 py-1.5 bg-red-600/10 text-red-400 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-600/20 hover:border-red-500/40 transition-all disabled:opacity-40 flex items-center gap-1.5 ml-auto"
                                            >
                                                {cancellingOrder === order.id ? <Loader2 size={10} className="animate-spin" /> : <Ban size={10} />}
                                                Cancel Order
                                            </button>
                                        )}
                                        {(orderStatuses[order.id] || order.status) === 'cancelled' && (
                                            <div className="mt-3 px-4 py-1.5 bg-red-600/10 text-red-400 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-auto w-fit">
                                                <XCircle size={10} /> Cancelled
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Stepper */}
                                {(orderStatuses[order.id] || order.status) !== 'cancelled' && (
                                <div className="mb-10">
                                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] flex items-center gap-4 mb-6">
                                        <div className="w-10 h-0.5 bg-purple-500/30"></div> Order Status
                                    </h4>
                                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                                        {STATUS_STEPS.map((step, idx) => {
                                            const Icon = step.icon;
                                            const isCompleted = idx < currentIdx;
                                            const isCurrent = idx === currentIdx;
                                            const isClickable = updatingStatus !== order.id;

                                            const colorMap = {
                                                purple: {
                                                    active: 'bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.5)]',
                                                    completed: 'bg-purple-600/80 border-purple-500/50',
                                                    inactive: 'bg-gray-800/50 border-white/10 hover:border-purple-500/30',
                                                    text: { active: 'text-purple-300', completed: 'text-purple-400', inactive: 'text-gray-500' }
                                                },
                                                amber: {
                                                    active: 'bg-amber-600 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]',
                                                    completed: 'bg-amber-600/80 border-amber-500/50',
                                                    inactive: 'bg-gray-800/50 border-white/10 hover:border-amber-500/30',
                                                    text: { active: 'text-amber-300', completed: 'text-amber-400', inactive: 'text-gray-500' }
                                                },
                                                green: {
                                                    active: 'bg-green-600 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]',
                                                    completed: 'bg-green-600/80 border-green-500/50',
                                                    inactive: 'bg-gray-800/50 border-white/10 hover:border-green-500/30',
                                                    text: { active: 'text-green-300', completed: 'text-green-400', inactive: 'text-gray-500' }
                                                },
                                            };

                                            const colors = colorMap[step.color];
                                            const bgClass = isCurrent ? colors.active : isCompleted ? colors.completed : colors.inactive;
                                            const textClass = isCurrent ? colors.text.active : isCompleted ? colors.text.completed : colors.text.inactive;

                                            return (
                                                <React.Fragment key={step.key}>
                                                    <button
                                                        onClick={() => isClickable && handleStatusChange(order.id, step.key)}
                                                        disabled={!isClickable}
                                                        className={`flex flex-col items-center gap-2 sm:gap-3 flex-1 p-3 sm:p-4 rounded-2xl border transition-all duration-500 ${bgClass} ${isClickable ? 'cursor-pointer' : 'cursor-wait'}`}
                                                    >
                                                        <div className={`relative ${updatingStatus === order.id && isCurrent ? 'animate-pulse' : ''}`}>
                                                            <Icon size={20} className={`sm:hidden ${isCurrent || isCompleted ? 'text-white' : textClass}`} />
                                                            <Icon size={24} className={`hidden sm:block ${isCurrent || isCompleted ? 'text-white' : textClass}`} />
                                                            {isCurrent && (
                                                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white animate-ping"></div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-center leading-tight ${isCurrent || isCompleted ? 'text-white/90' : textClass}`}>
                                                            {step.label}
                                                        </span>
                                                    </button>
                                                    {idx < STATUS_STEPS.length - 1 && (
                                                        <div className={`w-6 sm:w-12 h-0.5 flex-shrink-0 transition-colors duration-500 ${idx < currentIdx ? 'bg-white/30' : 'bg-white/5'}`}></div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                                )}

                                {/* Order Items + Shipping */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                    <div className="space-y-8">
                                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                            <div className="w-10 h-0.5 bg-purple-500/30"></div> Shipping Details
                                        </h4>
                                        <div className="grid grid-cols-1 gap-8">
                                            <div className="space-y-2 group/coord">
                                                <div className="text-[10px] font-black text-gray-500 group-hover/coord:text-gray-300 transition-colors">SHIPPING ADDRESS</div>
                                                <p className="text-sm font-bold text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">{order.shipping_address}</p>
                                            </div>
                                            <div className="space-y-2 group/coord">
                                                <div className="text-[10px] font-black text-gray-500 group-hover/coord:text-gray-300 transition-colors">BILLING ADDRESS</div>
                                                <p className="text-sm font-bold text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">{order.billing_address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                            <div className="w-10 h-0.5 bg-pink-500/30"></div> Order Items
                                        </h4>
                                        <div className="space-y-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-6 bg-white/5 p-5 rounded-3xl border border-white/5 group-hover:bg-purple-500/5 transition-all duration-700">
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 bg-gray-900">
                                                        <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-black text-white text-lg tracking-tight truncate">{item.product_name}</div>
                                                        <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">
                                                            Qty: {item.quantity} <span className="mx-2 text-gray-600">|</span> Price: ${item.price}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Toggle Bar */}
                            <div
                                className="bg-white/5 px-10 py-6 border-t border-white/5 flex justify-between items-center cursor-pointer hover:bg-white/[0.07] transition-colors duration-300"
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <MessageCircle size={18} className="text-purple-400" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Messages</span>
                                    {msgCount > 0 && (
                                        <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full min-w-[24px] text-center">
                                            {msgCount}
                                        </span>
                                    )}
                                </div>
                                {isExpanded ? (
                                    <ChevronUp size={18} className="text-gray-400" />
                                ) : (
                                    <ChevronDown size={18} className="text-gray-400" />
                                )}
                            </div>

                            {/* Expanded Message Panel */}
                            {isExpanded && (
                                <div className="border-t border-white/5 bg-gray-950/30">
                                    {/* Message History */}
                                    <div className="max-h-80 overflow-y-auto px-10 py-6 space-y-4">
                                        {(!messages[order.id] || messages[order.id].length === 0) ? (
                                            <div className="text-center py-8">
                                                <Mail size={32} className="mx-auto text-gray-600 mb-3" />
                                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">No messages yet</p>
                                                <p className="text-[10px] text-gray-500 mt-2">Send a message to the customer below</p>
                                            </div>
                                        ) : (
                                            messages[order.id].map((msg, idx) => (
                                                <div key={msg.id || idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                                                        msg.sender === 'admin'
                                                            ? 'bg-purple-600/20 border border-purple-500/20 text-purple-200'
                                                            : 'bg-white/5 border border-white/10 text-gray-300'
                                                    }`}>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            {msg.sender === 'admin' ? (
                                                                <User size={10} className="text-purple-400" />
                                                            ) : (
                                                                <User size={10} className="text-gray-400" />
                                                            )}
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                                {msg.sender === 'admin' ? 'Admin' : 'Customer'}
                                                            </span>
                                                            <span className="text-[9px] text-gray-500">
                                                                {new Date(msg.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        {msg.message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
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

                                    {/* Log Customer Reply */}
                                    <div className="px-10 pb-2">
                                        {showLogReply === order.id ? (
                                            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-3">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Log Customer Email Reply</div>
                                                <textarea
                                                    value={logReplyText}
                                                    onChange={(e) => setLogReplyText(e.target.value)}
                                                    placeholder="Paste the customer's email reply here..."
                                                    className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                                                    rows={3}
                                                />
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleLogReply(order.id)}
                                                        disabled={!logReplyText.trim() || sendingMessage}
                                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors disabled:opacity-40"
                                                    >
                                                        {sendingMessage ? 'Saving...' : 'Save Reply'}
                                                    </button>
                                                    <button
                                                        onClick={() => { setShowLogReply(null); setLogReplyText(''); }}
                                                        className="px-4 py-2 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowLogReply(order.id)}
                                                className="text-[10px] font-black text-gray-400 hover:text-gray-300 uppercase tracking-widest transition-colors flex items-center gap-2"
                                            >
                                                <Mail size={12} /> Log Customer Reply
                                            </button>
                                        )}
                                    </div>

                                    {/* Info note */}
                                    <div className="px-10 py-2">
                                        <p className="text-[9px] text-gray-500 italic">Customer replies are automatically captured via email</p>
                                    </div>

                                    {/* Image Preview */}
                                    {imagePreview && (
                                        <div className="px-10 pb-2">
                                            <div className="inline-block relative">
                                                <img src={imagePreview} alt="Preview" className="max-h-32 rounded-xl border border-purple-500/30" />
                                                <button
                                                    onClick={clearImage}
                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-white rounded-full p-1 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Send Message Input */}
                                    <div className="px-10 pb-6 pt-2">
                                        <div className="flex gap-3">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-purple-400 hover:border-purple-500/40 transition-all"
                                                title="Attach image"
                                            >
                                                <ImagePlus size={18} />
                                            </button>
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(order.id)}
                                                placeholder="Type a message to send to customer..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition-colors"
                                            />
                                            <button
                                                onClick={() => handleSendMessage(order.id)}
                                                disabled={(!newMessage.trim() && !selectedImage) || sendingMessage}
                                                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20"
                                            >
                                                {sendingMessage ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Send size={14} />
                                                )}
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
                )}
                </>
            )}
        </div>
    );
};

export default OrderList;
