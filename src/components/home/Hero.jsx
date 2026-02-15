import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Palette, Camera, Send, X, ShoppingCart, Wand2, Sparkles, Loader2, Package, Bookmark, Check, Plus } from 'lucide-react';
import { playClink, playHum, playGrab } from '../../utils/sounds';
import { GeminiService } from '../../services/gemini';
import { calculateToyPrice } from '../../utils/pricing';
import Button from '../ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import ColorModal from '../chat/ColorModal';

const Hero = ({ setView, addToCart, user, chatSessionId, setChatSessionId }) => {
    const [heroInput, setHeroInput] = useState('');
    const [targetColor, setTargetColor] = useState('Matte Black');
    const [uploadedImage, setUploadedImage] = useState(null);
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);
    const chatAreaRef = useRef(null);
    const lastAssistantRef = useRef(null);

    // Chat state
    const [messages, setMessages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState(null);
    const [cartFeedback, setCartFeedback] = useState(null);

    // Color modal
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [customColor, setCustomColor] = useState('');

    // Image lightbox
    const [lightboxImage, setLightboxImage] = useState(null);
    const [lightboxName, setLightboxName] = useState('');

    // Stores the last uploaded image for clarification follow-ups
    // When Gemini asks "which object?", the user's text reply needs the original image re-attached
    const pendingImageRef = useRef(null);

    // ---- Chat Persistence ----

    // Fire-and-forget: persist a message to the DB
    const persistMessage = useCallback(async (sessionId, message) => {
        if (!user || !sessionId) return;
        try {
            await fetch(`/api/chat/sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: message.role,
                    content: message.content,
                    image: message.image || null,
                    productJson: message.product ? JSON.stringify(message.product) : null
                })
            });
        } catch (e) {
            console.error('Failed to persist message:', e);
        }
    }, [user]);

    // Create a new chat session and return the session id
    const createSession = useCallback(async () => {
        if (!user) return null;
        try {
            const res = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const session = await res.json();
            setChatSessionId(session.id);
            sessionStorage.setItem('active_chat_session_id', session.id);
            return session.id;
        } catch (e) {
            console.error('Failed to create chat session:', e);
            return null;
        }
    }, [user, setChatSessionId]);

    // Restore session on mount (logged-in user returning to home)
    useEffect(() => {
        if (!user) return;
        const savedSessionId = sessionStorage.getItem('active_chat_session_id');
        if (savedSessionId && messages.length === 0 && !chatSessionId) {
            // Restore messages from the saved session
            (async () => {
                try {
                    const res = await fetch(`/api/chat/sessions/${savedSessionId}/messages`);
                    const dbMessages = await res.json();
                    if (dbMessages && dbMessages.length > 0) {
                        const restored = dbMessages.map(m => ({
                            role: m.role,
                            content: m.content,
                            image: m.image || null,
                            product: m.product_json ? JSON.parse(m.product_json) : null
                        }));
                        setMessages(restored);
                        setChatSessionId(savedSessionId);

                        // Check if a generation was interrupted (e.g., full page refresh)
                        const wasGenerating = sessionStorage.getItem('generation_in_progress');
                        if (wasGenerating === 'true') {
                            const lastMsg = restored[restored.length - 1];
                            if (lastMsg && lastMsg.role === 'user') {
                                // Last persisted message is from the user with no AI reply
                                setMessages(prev => [...prev, {
                                    role: 'assistant',
                                    content: 'It looks like your last design generation was interrupted. Please resend your request or describe what you\'d like to create!'
                                }]);
                            }
                            sessionStorage.removeItem('generation_in_progress');
                            sessionStorage.removeItem('generation_started_at');
                        }
                    }
                } catch (e) {
                    console.error('Failed to restore chat session:', e);
                }
            })();
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync chatSessionId to sessionStorage
    useEffect(() => {
        if (chatSessionId) {
            sessionStorage.setItem('active_chat_session_id', chatSessionId);
        }
    }, [chatSessionId]);

    // Start a new chat — clear messages, session, and sessionStorage
    const startNewChat = () => {
        setMessages([]);
        setChatSessionId(null);
        pendingImageRef.current = null;
        sessionStorage.removeItem('active_chat_session_id');
        sessionStorage.removeItem('generation_in_progress');
        sessionStorage.removeItem('generation_started_at');
    };

    // Scroll helper — scrolls to the top of the last assistant response (image start)
    const scrollToLastAssistant = useCallback((delay = 50) => {
        setTimeout(() => {
            if (lastAssistantRef.current) {
                lastAssistantRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }, delay);
    }, []);

    // Scroll to keep the generating indicator visible (scroll to bottom of chat)
    const scrollToEnd = useCallback((delay = 50) => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, delay);
    }, []);

    // Auto-scroll: when generating, keep the spinner visible; when AI responds, scroll to top of response
    useEffect(() => {
        if (isGenerating) {
            // User just sent a message, keep generating spinner in view
            scrollToEnd(50);
        }
    }, [isGenerating, scrollToEnd]);

    // When a new assistant message arrives, scroll to the top of it (the image)
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
            // Scroll to top of the last assistant message with a slight delay for DOM render
            scrollToLastAssistant(100);
            // Second delayed scroll catches images that loaded after initial render
            scrollToLastAssistant(700);
        }
    }, [messages, scrollToLastAssistant]);

    const handleSend = async (overrideInput = null, overrideImage = null) => {
        const textToSend = typeof overrideInput === 'string' ? overrideInput : heroInput;
        const isSystemAction = typeof overrideInput === 'string';
        // Use override image, or currently uploaded image, or pending image from clarification flow
        const imageToSend = overrideImage || uploadedImage || pendingImageRef.current;

        if (!textToSend.trim() && !imageToSend) return;

        const currentApiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!currentApiKey) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Our design service is temporarily unavailable. Please try again in a moment.' }]);
            return;
        }

        if (currentApiKey.startsWith('AQ.')) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Our design service is temporarily unavailable due to a configuration issue. Please try again later or contact support.' }]);
            return;
        }

        let finalInput;
        if (isSystemAction) {
            finalInput = textToSend;
        } else if (imageToSend && !textToSend.trim()) {
            // Image uploaded without text — tell AI to convert it to a 3D print
            finalInput = `Convert this into a 3D printed PLA object (Filament Color: ${targetColor})`;
        } else {
            finalInput = `${textToSend} (Filament Color: ${targetColor})`;
        }

        // Only show the image in the user bubble if it was freshly uploaded (not a pending re-send)
        const showImageInBubble = overrideImage || uploadedImage;
        const userMessage = { role: 'user', content: finalInput, image: showImageInBubble || null };
        setMessages(prev => [...prev, userMessage]);

        if (!isSystemAction) {
            setHeroInput('');
            setUploadedImage(null);
        }

        setIsGenerating(true);

        // Mark generation in progress for recovery on page refresh
        sessionStorage.setItem('generation_in_progress', 'true');
        sessionStorage.setItem('generation_started_at', Date.now().toString());

        // ---- Persist user message ----
        let activeSessionId = chatSessionId;
        if (user && !activeSessionId) {
            activeSessionId = await createSession();
        }
        if (activeSessionId) {
            persistMessage(activeSessionId, userMessage);
        }

        try {
            const gemini = new GeminiService(currentApiKey);

            // If there's a pending image (clarification flow), pass recent conversation history
            // so Gemini knows this is a follow-up and should not ask again
            let conversationHistory = [];
            if (pendingImageRef.current) {
                // Get the last few messages for context (the clarification exchange)
                const recentMessages = [...messages].slice(-4).map(m => ({
                    role: m.role,
                    content: m.content
                }));
                conversationHistory = recentMessages;
            }

            const result = await gemini.generateProductDesign(userMessage.content, imageToSend, conversationHistory);

            if (result.product) {
                const pricing = calculateToyPrice(null, null, null);
                result.product.price = pricing.finalPrice;
                result.product.estimatedWeight = pricing.weight;
                result.product.estimatedHours = pricing.hours;
                // Product generated — clear the pending image, clarification resolved
                pendingImageRef.current = null;
            } else if (imageToSend) {
                // No product generated (clarification question) — keep the image for the next reply
                pendingImageRef.current = imageToSend;
            }

            const assistantMessage = {
                role: 'assistant',
                content: result.text || `I've designed the ${result.product?.name}!`,
                product: result.product
            };
            setMessages(prev => [...prev, assistantMessage]);

            // ---- Persist assistant message ----
            if (activeSessionId) {
                persistMessage(activeSessionId, assistantMessage);
            }

            playClink();
        } catch (error) {
            console.error("Design generation error:", error);
            let errorMessage;
            if (error.message?.includes('429') || error.status === 429) {
                errorMessage = "We're experiencing high demand right now. Please wait a moment and try again.";
            } else {
                errorMessage = "Sorry, I wasn't able to generate your design right now. Please try again in a moment. If the issue persists, contact our support team for help.";
            }
            const errMsg = { role: 'assistant', content: errorMessage };
            setMessages(prev => [...prev, errMsg]);
            if (activeSessionId) {
                persistMessage(activeSessionId, errMsg);
            }
        } finally {
            setIsGenerating(false);
            sessionStorage.removeItem('generation_in_progress');
            sessionStorage.removeItem('generation_started_at');
        }
    };

    const handleColorEdit = (product) => {
        setProductToEdit(product);
        setCustomColor('');
        setIsColorModalOpen(true);
    };

    const confirmColorChange = () => {
        if (productToEdit && customColor) {
            handleSend(`SYSTEM_UPDATE: Reference the Attached Image. Re-generate this EXACT product with a new material color: ${customColor}.

            CRITICAL INSTRUCTIONS:
            1. STRUCTURE: The 3D geometry, pose, and background MUST be identical to the attached image.
            2. COLOR: Only change the material color to "${customColor}".
            3. DETAILS: Keep the name "${productToEdit.name}". Keep the same description and price.
            4. IMAGE PROMPT: Use the original image prompt but swap the color keywords.`, productToEdit.image);

            setIsColorModalOpen(false);
            setProductToEdit(null);
        }
    };

    const saveBlueprint = async (product) => {
        if (!user) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Please sign in to save designs to your account.' }]);
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/blueprints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    image: product.image,
                    image_prompt: product.image_prompt
                })
            });
            if (!response.ok) throw new Error('Failed to save blueprint');
            setSaveFeedback(product.name);
            setTimeout(() => setSaveFeedback(null), 3000);
        } catch (error) {
            console.error('Save error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, we couldn\'t save your design right now. Please try again.' }]);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            playHum();
            const reader = new FileReader();
            reader.onloadend = () => setUploadedImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const hasMessages = messages.length > 0;

    return (
        <>
            {/* Full-height flex container when chatting */}
            <div className={`relative overflow-hidden ${hasMessages ? 'flex flex-col h-[calc(100vh-73px)]' : 'pt-16 sm:pt-20 md:pt-24 pb-8'}`}>
                {/* Animated Glows */}
                <div className="absolute top-20 right-[10%] w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
                <div className="absolute -bottom-20 left-[10%] w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse animation-delay-2000 pointer-events-none"></div>

                <div className={`container mx-auto px-3 sm:px-4 text-center relative z-10 ${hasMessages ? 'flex flex-col flex-1 min-h-0 py-3 sm:py-4' : ''}`}>
                    {/* Hero headline — collapses when chat is active */}
                    {!hasMessages && (
                        <>
                            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-tighter">
                                Imagine It. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 neon-glow-purple">
                                    We 3D Print It.
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed font-medium px-2">
                                Hi, I'm <span className="text-white font-bold">Arav</span>! I'm 9 years old and I turn your ideas into real 3D-printed creations.
                                Describe what you want and let's bring it to life!
                            </p>
                        </>
                    )}

                    {/* Compact header when chat is active */}
                    {hasMessages && (
                        <div className="mb-2 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                                <Wand2 size={16} className="text-white sm:hidden" />
                                <Wand2 size={20} className="text-white hidden sm:block" />
                            </div>
                            <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
                                3D<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Printables</span><span className="text-purple-400 text-[10px] sm:text-sm">.ai</span>
                                <span className="text-gray-500 font-medium text-[10px] sm:text-sm ml-2 sm:ml-3">Design Studio</span>
                            </h2>
                            <button
                                onClick={startNewChat}
                                className="ml-2 sm:ml-4 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-500 hover:bg-purple-500/10 hover:text-purple-400 transition-all border border-white/10 hover:border-purple-500/20"
                                title="Start a new chat"
                            >
                                <Plus size={10} className="sm:hidden" />
                                <Plus size={12} className="hidden sm:block" />
                                <span className="hidden sm:inline">New Chat</span>
                                <span className="sm:hidden">New</span>
                            </button>
                        </div>
                    )}

                    {/* Full Chat Interface */}
                    <div className={`max-w-4xl mx-auto ${hasMessages ? 'flex flex-col flex-1 min-h-0' : 'mb-6'}`}>
                        <div className={`relative group/hero-chat ${hasMessages ? 'flex flex-col flex-1 min-h-0' : ''}`}>
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-[2.5rem] opacity-30 blur-xl group-hover/hero-chat:opacity-50 transition-opacity duration-500 pointer-events-none"></div>
                            <div className={`relative bg-gray-950/90 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden ${hasMessages ? 'flex flex-col flex-1 min-h-0' : ''}`}>

                                {/* Chat Messages Area — fills available space */}
                                {hasMessages && (
                                    <div ref={chatAreaRef} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-500/30 text-left">
                                        {messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                ref={msg.role === 'assistant' ? lastAssistantRef : null}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                                            >
                                                <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.role === 'user'
                                                        ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white'
                                                        : 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                                                        }`}>
                                                        {msg.role === 'user' ? <ShoppingCart size={14} className="sm:hidden" /> : <Wand2 size={14} className="sm:hidden" />}
                                                        {msg.role === 'user' ? <ShoppingCart size={16} className="hidden sm:block" /> : <Wand2 size={16} className="hidden sm:block" />}
                                                    </div>
                                                    <div className="space-y-2 sm:space-y-3 flex-1">
                                                        {/* User message or uploaded image */}
                                                        {msg.role === 'user' && (
                                                            <div className="rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-2xl border bg-purple-600/90 text-white border-purple-400/40 rounded-tr-none">
                                                                {msg.image && (
                                                                    <div className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-lg bg-gray-950 p-1">
                                                                        <img src={msg.image} alt="Inspiration" className="w-full h-full object-cover rounded-lg" />
                                                                    </div>
                                                                )}
                                                                <div className="relative z-10 leading-relaxed font-medium text-sm sm:text-base">
                                                                    {msg.content}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* AI response: Product card FIRST, then description */}
                                                        {msg.role === 'assistant' && msg.product && (
                                                            <div
                                                                className="bg-gray-950 rounded-xl sm:rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700 group/card relative"
                                                                onMouseEnter={playHum}
                                                                onMouseDown={playGrab}
                                                            >
                                                                <div className="floor-glow" style={{ '--glow-color': 'rgba(168, 85, 247, 0.4)' }}></div>
                                                                <div
                                                                    className="relative aspect-square sm:aspect-[16/10] overflow-hidden bg-gray-900 cursor-zoom-in"
                                                                    onClick={() => { setLightboxImage(msg.product.image); setLightboxName(msg.product.name); }}
                                                                >
                                                                    <img
                                                                        src={msg.product.image}
                                                                        alt={msg.product.name}
                                                                        className="w-full h-full object-cover group-hover/card:scale-110 transition-all duration-1000 opacity-0"
                                                                        onLoad={(e) => {
                                                                            e.target.classList.remove('opacity-0');
                                                                            e.target.classList.add('opacity-100');
                                                                            // Scroll to show the top of the product card (the image)
                                                                            scrollToLastAssistant(150);
                                                                        }}
                                                                        onError={(e) => { e.target.src = 'https://placehold.co/800x600/f3f4f6/94a3b8?text=Design+Preview+Generating...'; e.target.classList.remove('opacity-0'); e.target.classList.add('opacity-100'); }}
                                                                    />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-90 pointer-events-none"></div>
                                                                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-5 right-3 sm:right-5">
                                                                        <h3 className="text-lg sm:text-2xl font-black text-white mb-1">{msg.product.name}</h3>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-purple-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{msg.product.category}</span>
                                                                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                                            <span className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Design Preview</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                                                                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 sm:gap-3">
                                                                        <Sparkles size={12} className="text-purple-400 animate-pulse sm:hidden" />
                                                                        <Sparkles size={14} className="text-purple-400 animate-pulse hidden sm:block" />
                                                                        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                                                                            <span className="text-purple-400">Custom Made</span> — request a quote for pricing
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                                                        <div className="flex-[1.5] flex gap-2">
                                                                            <Button
                                                                                onClick={() => { playHum(); handleColorEdit(msg.product); }}
                                                                                className="flex-1 py-3 sm:py-4 text-xs sm:text-sm bg-gray-800 text-purple-400 hover:bg-gray-700 hover:text-purple-300 shadow-none rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 border border-purple-500/20"
                                                                            >
                                                                                <Palette size={14} className="sm:hidden" />
                                                                                <Palette size={16} className="hidden sm:block" />
                                                                                Color
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => { playClink(); saveBlueprint(msg.product); }}
                                                                                disabled={isSaving}
                                                                                className="flex-1 py-3 sm:py-4 text-xs sm:text-sm bg-gray-800 text-blue-400 hover:bg-gray-700 hover:text-blue-300 shadow-none rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 border border-blue-500/20"
                                                                            >
                                                                                <Bookmark size={14} className="sm:hidden" />
                                                                                <Bookmark size={16} className="hidden sm:block" />
                                                                                Save
                                                                            </Button>
                                                                        </div>
                                                                        <Button
                                                                            onClick={() => {
                                                                                playClink();
                                                                                const finalPrice = typeof msg.product.price === 'number' ? msg.product.price : parseFloat(msg.product.price || 29.99);
                                                                                addToCart({ ...msg.product, price: finalPrice });
                                                                                setCartFeedback(msg.product.name);
                                                                                setTimeout(() => setCartFeedback(null), 3000);
                                                                                setTimeout(() => setView('cart'), 800);
                                                                            }}
                                                                            className="flex-[2] py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg sm:rounded-xl border-none shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_20px_40px_-5px_rgba(79,70,229,0.6)] transition-all flex items-center justify-center gap-2 sm:gap-3 group/btn"
                                                                        >
                                                                            <Send size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform sm:hidden" />
                                                                            <Send size={18} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform hidden sm:block" />
                                                                            <span>Get Quote</span>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* AI text description — shown AFTER the product card */}
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

                                        {isGenerating && (
                                            <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-500">
                                                <div className="flex gap-2 sm:gap-3">
                                                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
                                                        <Loader2 size={16} className="animate-spin sm:hidden" />
                                                        <Loader2 size={20} className="animate-spin hidden sm:block" />
                                                    </div>
                                                    <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 p-3 sm:p-5 rounded-xl sm:rounded-2xl rounded-tl-none shadow-xl">
                                                        <span className="text-[9px] sm:text-[10px] font-black text-purple-400 uppercase tracking-widest">Generating your design...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                )}

                                {/* Input Section */}
                                <div className="p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4 border-t border-white/5 flex-shrink-0">
                                    {/* Uploaded Image Preview */}
                                    {uploadedImage && (
                                        <div className="flex animate-in zoom-in duration-300">
                                            <div className="relative inline-block group self-start">
                                                <div className="w-16 h-16 sm:w-24 sm:h-24 p-1 bg-gray-900 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
                                                    <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 sm:p-1.5 shadow-xl hover:bg-rose-600 transition-all hover:scale-110 border-2 border-gray-950 z-20">
                                                    <X size={8} strokeWidth={4} className="sm:hidden" />
                                                    <X size={10} strokeWidth={4} className="hidden sm:block" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Color Selection */}
                                    <div className="bg-white/5 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                            <span className="text-[8px] sm:text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] flex items-center gap-1.5 sm:gap-2">
                                                <Palette size={10} className="text-purple-400 sm:hidden" />
                                                <Palette size={11} className="text-purple-400 hidden sm:block" />
                                                Color Selection
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {[
                                                { name: 'Matte Black', color: '#1a1a1a' },
                                                { name: 'Pure White', color: '#ffffff' },
                                                { name: 'Slate Grey', color: '#4b5563' },
                                                { name: 'Cobalt Blue', color: '#1e40af' },
                                                { name: 'Lava Red', color: '#b91c1c' }
                                            ].map((mat) => (
                                                <button
                                                    key={mat.name}
                                                    onClick={() => { playClink(); setTargetColor(mat.name); }}
                                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5 sm:gap-2 ${targetColor === mat.name
                                                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50 scale-105'
                                                        : 'bg-gray-900 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                                        }`}
                                                >
                                                    <div className="w-2 h-2 rounded-full shadow-inner" style={{ backgroundColor: mat.color }}></div>
                                                    {mat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Input Area */}
                                    <div className="flex gap-2 sm:gap-3 items-end bg-gray-900/80 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-white/10 hover:border-purple-500/40 focus-within:ring-2 focus-within:ring-purple-500/30 transition-all duration-500">
                                        <div className="relative p-0.5">
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-950 text-gray-500 rounded-lg sm:rounded-xl hover:bg-purple-500/10 hover:text-purple-400 cursor-pointer transition-all flex items-center justify-center border border-white/5 flex-shrink-0"
                                                title="Upload inspiration image"
                                            >
                                                <Camera size={18} strokeWidth={2} className="sm:hidden" />
                                                <Camera size={22} strokeWidth={2} className="hidden sm:block" />
                                            </button>
                                        </div>
                                        <textarea
                                            rows="1"
                                            placeholder="Describe your vision..."
                                            className="flex-1 bg-transparent border-none py-2.5 sm:py-3 px-1 sm:px-2 focus:ring-0 outline-none font-bold text-white placeholder-gray-600 resize-none min-h-[40px] sm:min-h-[48px] max-h-32 leading-relaxed scrollbar-hide text-sm sm:text-base md:text-lg"
                                            value={heroInput}
                                            onChange={(e) => setHeroInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) { playClink(); e.preventDefault(); handleSend(); }
                                            }}
                                        />
                                        <button
                                            onClick={() => { playClink(); handleSend(); }}
                                            disabled={isGenerating || (!heroInput.trim() && !uploadedImage)}
                                            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin sm:hidden" />
                                                    <Loader2 size={22} className="animate-spin hidden sm:block" />
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={18} strokeWidth={2.5} className="sm:hidden" />
                                                    <Send size={22} strokeWidth={2.5} className="hidden sm:block" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!hasMessages && (
                        <button
                            onClick={() => setView('our-story')}
                            className="text-gray-500 hover:text-purple-400 transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2 mx-auto group"
                        >
                            Learn Our Story <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>

            {/* Color Modal */}
            <ColorModal
                isColorModalOpen={isColorModalOpen}
                productToEdit={productToEdit}
                setIsColorModalOpen={setIsColorModalOpen}
                customColor={customColor}
                setCustomColor={setCustomColor}
                confirmColorChange={confirmColorChange}
            />

            {/* Cart Feedback Toast */}
            {cartFeedback && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className="bg-purple-600 shadow-[0_0_50px_rgba(147,51,234,0.5)] text-white px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[2rem] border border-purple-400 flex items-center gap-3 sm:gap-4 mx-4">
                        <div className="bg-white/20 p-1.5 sm:p-2 rounded-full">
                            <Check size={16} className="text-white sm:hidden" />
                            <Check size={20} className="text-white hidden sm:block" />
                        </div>
                        <div className="font-black uppercase tracking-widest text-[10px] sm:text-xs">
                            <span className="text-white">"{cartFeedback}"</span> added to quote
                        </div>
                    </div>
                </div>
            )}

            {/* Save Feedback Toast */}
            {saveFeedback && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-gray-900/90 backdrop-blur-md text-white px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 flex items-center gap-3 sm:gap-4 mx-4">
                        <div className="bg-green-500 p-1.5 sm:p-2 rounded-full">
                            <Check size={16} className="text-white sm:hidden" />
                            <Check size={20} className="text-white hidden sm:block" />
                        </div>
                        <div className="font-bold text-sm sm:text-base">
                            <span className="text-purple-300">"{saveFeedback}"</span> saved!
                        </div>
                    </div>
                </div>
            )}

            {/* Image Lightbox Modal */}
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
                                <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1">Click outside or X to close</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Hero;
