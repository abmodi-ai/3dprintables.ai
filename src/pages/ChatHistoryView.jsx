import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wand2, ShoppingCart, Sparkles, Clock, Loader2, X, MessageSquare, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

const ChatHistoryView = ({ sessionId, setView, setChatSessionId }) => {
    const [messages, setMessages] = useState([]);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [lightboxName, setLightboxName] = useState('');

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        setIsLoading(true);
        try {
            const messagesRes = await fetch(`/api/chat/sessions/${sessionId}/messages`);
            const messagesData = await messagesRes.json();

            // Parse product_json for assistant messages
            const parsed = messagesData.map(m => ({
                role: m.role,
                content: m.content,
                image: m.image || null,
                product: m.product_json ? JSON.parse(m.product_json) : null,
                created_at: m.created_at
            }));

            setMessages(parsed);
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinueChat = () => {
        // Set this session as the active chat session and go to home
        setChatSessionId(sessionId);
        sessionStorage.setItem('active_chat_session_id', sessionId);
        setView('home');
    };

    if (!sessionId) {
        return (
            <div className="container mx-auto px-4 py-12 sm:py-20 text-center">
                <MessageSquare className="mx-auto text-gray-700 mb-4" size={48} />
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">No Chat Selected</h2>
                <Button onClick={() => setView('account')}>Go to Account</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-8 gap-2">
                <button
                    onClick={() => setView('account')}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <ArrowLeft size={16} className="sm:hidden" />
                    <ArrowLeft size={18} className="hidden sm:block" />
                    <span className="hidden sm:inline">Back to Account</span>
                    <span className="sm:hidden">Back</span>
                </button>
                <Button
                    onClick={handleContinueChat}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2"
                >
                    <span className="hidden sm:inline">Continue this Chat</span>
                    <span className="sm:hidden">Continue</span>
                    <ArrowRight size={14} className="sm:hidden" />
                    <ArrowRight size={16} className="hidden sm:block" />
                </Button>
            </div>

            {/* Chat title bar */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                    <Wand2 size={16} className="text-white sm:hidden" />
                    <Wand2 size={20} className="text-white hidden sm:block" />
                </div>
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                    Chat History
                    <span className="text-gray-500 font-medium text-[10px] sm:text-sm ml-2 sm:ml-3">Read-only</span>
                </h2>
            </div>

            {isLoading ? (
                <div className="text-center py-12 sm:py-20">
                    <Clock className="animate-spin mx-auto text-purple-500 mb-4" size={36} />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs sm:text-sm">Loading conversation...</p>
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-12 sm:py-20">
                    <MessageSquare className="mx-auto text-gray-700 mb-4" size={48} />
                    <h4 className="text-xl sm:text-2xl font-black text-gray-600">No messages found</h4>
                    <p className="text-gray-500 font-bold mt-2 text-sm">This chat session appears to be empty.</p>
                </div>
            ) : (
                /* Chat Messages */
                <div className="relative">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-2xl sm:rounded-[2.5rem] opacity-20 blur-xl pointer-events-none"></div>
                    <div className="relative bg-gray-950/90 backdrop-blur-xl rounded-xl sm:rounded-[2rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/30 text-left">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                                    <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white'
                                            : 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                                            }`}>
                                            {msg.role === 'user' ? <ShoppingCart size={14} className="sm:hidden" /> : <Wand2 size={14} className="sm:hidden" />}
                                            {msg.role === 'user' ? <ShoppingCart size={16} className="hidden sm:block" /> : <Wand2 size={16} className="hidden sm:block" />}
                                        </div>
                                        <div className="space-y-2 sm:space-y-3 flex-1">
                                            {/* User message */}
                                            {msg.role === 'user' && (
                                                <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-2xl border bg-purple-600/90 text-white border-purple-400/40 rounded-tr-none">
                                                    {msg.image && (
                                                        <div className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-lg bg-gray-950 p-1">
                                                            <img src={msg.image} alt="Uploaded" className="w-full h-full object-cover rounded-lg" />
                                                        </div>
                                                    )}
                                                    <div className="relative z-10 leading-relaxed font-medium text-sm sm:text-base">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI response: Product card */}
                                            {msg.role === 'assistant' && msg.product && (
                                                <div className="bg-gray-950 rounded-xl sm:rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                                    <div
                                                        className="relative aspect-square sm:aspect-[16/10] overflow-hidden bg-gray-900 cursor-zoom-in"
                                                        onClick={() => { setLightboxImage(msg.product.image); setLightboxName(msg.product.name); }}
                                                    >
                                                        <img
                                                            src={msg.product.image}
                                                            alt={msg.product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.src = 'https://placehold.co/800x600/f3f4f6/94a3b8?text=Image+Unavailable'; }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-90 pointer-events-none"></div>
                                                        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-5 right-3 sm:right-5">
                                                            <h3 className="text-lg sm:text-2xl font-black text-white mb-1">{msg.product.name}</h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-purple-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{msg.product.category}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 sm:p-6">
                                                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 sm:gap-3">
                                                            <Sparkles size={12} className="text-purple-400 sm:hidden" />
                                                            <Sparkles size={14} className="text-purple-400 hidden sm:block" />
                                                            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                                                                <span className="text-purple-400">AI Generated</span> — Design Preview
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI text */}
                                            {msg.role === 'assistant' && msg.content && (
                                                <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-2xl border bg-gray-900/80 text-white/90 border-white/10 rounded-tl-none">
                                                    <div className="relative z-10 leading-relaxed font-medium text-gray-300 text-xs sm:text-sm">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                                            components={{
                                                                p: ({ node, ...props }) => <p className="leading-relaxed mb-3 last:mb-0 text-gray-300" {...props} />,
                                                                strong: ({ node, ...props }) => <strong className="font-extrabold text-white" {...props} />,
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Read-only notice */}
                        <div className="p-3 sm:p-4 border-t border-white/5 bg-white/5 text-center">
                            <p className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                This is a read-only view of a past conversation
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 cursor-zoom-out p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10 border border-white/10"
                    >
                        <X size={20} className="sm:hidden" />
                        <X size={24} className="hidden sm:block" />
                    </button>
                    <div className="relative max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={lightboxImage}
                            alt={lightboxName}
                            className="max-w-full max-h-[85vh] object-contain rounded-xl sm:rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)]"
                        />
                        {lightboxName && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 rounded-b-xl sm:rounded-b-2xl">
                                <h3 className="text-white font-black text-base sm:text-xl">{lightboxName}</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHistoryView;
