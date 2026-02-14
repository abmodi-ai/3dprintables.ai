import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Wand2, Trash2, Sparkles, Loader2, Package, Palette, Bookmark, Ruler, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import { GeminiService } from '../services/gemini';
import { calculateToyPrice } from '../utils/pricing';
import { playClink, playHum, playGrab } from '../utils/sounds';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import ChatHeader from '../components/chat/ChatHeader';
import ChatInput from '../components/chat/ChatInput';
import ColorModal from '../components/chat/ColorModal';

const HeaderSection = ({ ...props }) => (
    <section className="bg-purple-50/70 p-6 rounded-2xl border border-purple-100 shadow-sm my-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="h-0.5 w-8 bg-purple-500 rounded-full"></div>
            <h4 className="text-purple-900 font-black tracking-tight text-sm uppercase" {...props} />
        </div>
    </section>
);

const AIChatPage = ({ addToCart, setView, user }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi there! I\'m your Gemini-powered Toy Designer. Describe any toy you can imagine, or upload a sketch, and I\'ll bring it to life with 3D design data and a preview image!' }
    ]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState(null);
    const [cartFeedback, setCartFeedback] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [targetColor, setTargetColor] = useState('Matte Black');
    const scrollRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);


    const handleSend = async (overrideInput = null, overrideImage = null) => {
        const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
        const isSystemAction = typeof overrideInput === 'string';

        // Use overrideImage if provided, otherwise use state uploadedImage
        const imageToSend = overrideImage || uploadedImage;

        if (!textToSend.trim() && !imageToSend) return;



        const currentApiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!currentApiKey) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'System Error: No API key found in .env. Please add VITE_GEMINI_API_KEY and restart your server.' }]);
            return;
        }

        if (currentApiKey.startsWith('AQ.')) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Laboratory Error: You are using an Identity Token (starts with AQ.) instead of a Gemini API Key. Please get a valid key (starts with AIzaSy) from Google AI Studio.' }]);
            return;
        }

        const finalInput = !isSystemAction
            ? `${textToSend} (Filament Color: ${targetColor})`
            : textToSend;

        const userMessage = { role: 'user', content: finalInput, image: imageToSend };
        setMessages(prev => [...prev, userMessage]);

        if (!isSystemAction) {
            setInput('');
            setUploadedImage(null);
        }

        setIsGenerating(true);

        try {
            const gemini = new GeminiService(currentApiKey);
            const result = await gemini.generateProductDesign(userMessage.content, imageToSend);

            if (result.product) {
                // Default pricing since explicit dimensions are bypassed
                const pricing = calculateToyPrice(null, null, null);

                result.product.price = pricing.finalPrice;
                result.product.estimatedWeight = pricing.weight;
                result.product.estimatedHours = pricing.hours;
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.text || `I've designed the ${result.product?.name}!`,
                product: result.product
            }]);
            playClink();
        } catch (error) {
            console.error("🚨 Gemini API Error Details:", error);

            let errorMessage = `I'm having trouble connecting to my brain (API Error).\n\n`;

            if (error.message?.includes('403') || error.status === 403) {
                errorMessage += "❌ Error 403: This API key doesn't have permission to use Gemini.\n\nPlease:\n1. Go to https://aistudio.google.com/apikey\n2. Create a new API key\n3. Update your .env file with: VITE_GEMINI_API_KEY=your-new-key";
            } else if (error.message?.includes('429') || error.status === 429) {
                errorMessage += "⏱️ Error 429: Rate limit exceeded. You've made too many requests.\n\nPlease wait a few minutes and try again.";
            } else if (error.message?.includes('400') || error.status === 400) {
                errorMessage += "❌ Error 400: Invalid request format or API key.\n\nPlease check your API key at https://aistudio.google.com/apikey";
            } else if (error.message?.includes('API key not found')) {
                errorMessage += "❌ No API key found in .env file.\n\nPlease add: VITE_GEMINI_API_KEY=your-key-here";
            } else {
                errorMessage += `❌ Unexpected error: ${error.message}\n\nCheck the browser console (F12) for details.`;
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [customColor, setCustomColor] = useState('');

    const handleColorEdit = (product) => {
        setProductToEdit(product);
        setCustomColor(''); // Reset color
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
            setMessages(prev => [...prev, { role: 'assistant', content: '🔒 Please sign in to save blueprints to your personal laboratory folder.' }]);
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('http://localhost:3001/api/blueprints', {
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
            alert('Failed to save blueprint. Please try again.');
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

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[85vh] flex flex-col">
            <div className="flex-1 bg-gray-950/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_100px_-16px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col mb-6 relative group border-t border-purple-500/30 ring-1 ring-white/5">
                {/* Glow effect */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-1000"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-1000"></div>

                <ChatHeader setMessages={setMessages} />

                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-100/50">
                    {messages.length <= 1 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000 py-12">
                            <div className="relative">
                                <div className="w-32 h-32 bg-gray-950 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(147,51,234,0.3)] relative z-10 overflow-hidden group/star">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 group-hover/star:opacity-100 transition-opacity"></div>
                                    <Sparkles size={56} className="text-purple-400 animate-pulse relative z-10" />
                                </div>
                                <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full animate-pulse"></div>
                            </div>
                            <div className="max-w-md space-y-3">
                                <h3 className="text-3xl font-black text-white leading-tight">Bring your ideas to life.</h3>
                                <p className="text-gray-400 font-medium">Dimensionally accurate pricing, real-time engineering analysis, and high-fidelity output.</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                            <div className={`flex gap-4 max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white'
                                    : 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                                    }`}>
                                    {msg.role === 'user' ? <ShoppingCart size={20} /> : <Wand2 size={20} />}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className={`rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl border ${msg.role === 'user'
                                        ? 'bg-purple-600/90 text-white border-purple-400/40 rounded-tr-none shadow-[0_10px_30px_rgba(147,51,234,0.2)]'
                                        : 'bg-gray-950/80 text-white/90 border-white/10 rounded-tl-none relative before:absolute before:inset-0 before:bg-[radial-gradient(#ffffff_1px,transparent_1px)] before:[background-size:20px_20px] before:opacity-[0.05] before:pointer-events-none shadow-[0_10px_40px_rgba(0,0,0,0.4)]'
                                        }`}>
                                        {msg.image && (
                                            <div className="mb-6 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-gray-950 relative z-10 p-1">
                                                <img src={msg.image} alt="Inspiration" className="w-full h-full object-cover rounded-xl" />
                                            </div>
                                        )}
                                        <div className="relative z-10 leading-relaxed font-medium markdown-content">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                                components={{
                                                    h1: ({ node, ...props }) => <HeaderSection {...props} />,
                                                    h2: ({ node, ...props }) => <HeaderSection {...props} />,
                                                    h3: ({ node, ...props }) => <HeaderSection {...props} />,
                                                    h4: ({ node, ...props }) => <HeaderSection {...props} />,
                                                    p: ({ node, ...props }) => <p className="leading-relaxed mb-4 last:mb-0 text-gray-300" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300" {...props} />,
                                                    li: ({ node, ...props }) => <li className="pl-1 marker:text-purple-400" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-extrabold text-white" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {msg.product && (
                                        <div
                                            className="bg-gray-950 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700 group/card relative"
                                            onMouseEnter={playHum}
                                            onMouseDown={playGrab}
                                        >
                                            <div className="floor-glow" style={{ '--glow-color': 'rgba(168, 85, 247, 0.4)' }}></div>
                                            <div className="relative aspect-square sm:aspect-[16/10] overflow-hidden bg-gray-900">
                                                <img
                                                    src={msg.product.image}
                                                    alt={msg.product.name}
                                                    className="w-full h-full object-cover group-hover/card:scale-110 transition-all duration-1000 opacity-0"
                                                    onLoad={(e) => {
                                                        e.target.classList.remove('opacity-0');
                                                        e.target.classList.add('opacity-100');
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = 'https://placehold.co/800x600/f3f4f6/94a3b8?text=Design+Preview+Generating...';
                                                        e.target.classList.remove('opacity-0');
                                                        e.target.classList.add('opacity-100');
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-90 pointer-events-none"></div>
                                                <div className="absolute bottom-6 left-6 right-6">
                                                    <div className="text-white">
                                                        <h3 className="text-3xl font-black mb-1 group-hover/card:translate-x-1 transition-transform">{msg.product.name}</h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">{msg.product.category}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ready for Manufacturing</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-8 space-y-6">
                                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-center gap-4 group/protocol relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent"></div>
                                                    <Sparkles size={16} className="text-purple-400 animate-pulse" />
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] relative z-10">
                                                        <span className="text-purple-400">Price Protocol:</span> We will tell you the price later
                                                    </p>
                                                </div>


                                                <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/10">
                                                    <p className="text-gray-400 font-medium italic text-center text-sm">"{msg.product.description}"</p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    <div className="flex-[1.5] flex gap-2">
                                                        <Button
                                                            onClick={() => { playHum(); handleColorEdit(msg.product); }}
                                                            className="flex-1 py-5 text-sm bg-gray-800 text-purple-400 hover:bg-gray-700 hover:text-purple-300 shadow-none rounded-[1.5rem] flex items-center justify-center gap-2 border border-purple-500/20"
                                                        >
                                                            <Palette size={18} />
                                                            <span className="hidden sm:inline">Color</span>
                                                        </Button>
                                                        <Button
                                                            onClick={() => { playClink(); saveBlueprint(msg.product); }}
                                                            disabled={isSaving}
                                                            className="flex-1 py-5 text-sm bg-gray-800 text-blue-400 hover:bg-gray-700 hover:text-blue-300 shadow-none rounded-[1.5rem] flex items-center justify-center gap-2 border border-blue-500/20"
                                                        >
                                                            <Bookmark size={18} />
                                                            <span className="hidden sm:inline">Archive</span>
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        onClick={() => {
                                                            playClink();
                                                            const finalPrice = typeof msg.product.price === 'number' ? msg.product.price : parseFloat(msg.product.price || 29.99);
                                                            addToCart({ ...msg.product, price: finalPrice });

                                                            // Success Feedback Protocol
                                                            setCartFeedback(msg.product.name);
                                                            setTimeout(() => setCartFeedback(null), 3000);

                                                            // Strategic delay for user gratification
                                                            setTimeout(() => setView('cart'), 800);
                                                        }}
                                                        className="flex-[2] py-5 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-[1.5rem] border-none shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_20px_40px_-5px_rgba(79,70,229,0.6)] transition-all duration-300 flex items-center justify-center gap-4 group/btn"
                                                    >
                                                        <Package className="group-hover/btn:rotate-12 transition-transform" />
                                                        <span>Add to Cart</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isGenerating && (
                        <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
                                    <Loader2 size={24} className="animate-spin" />
                                </div>
                                <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-6 rounded-3xl rounded-tl-none shadow-xl">
                                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Laboratory Analysis Underway...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <ChatInput
                    uploadedImage={uploadedImage}
                    setUploadedImage={setUploadedImage}
                    length={length}
                    setLength={setLength}
                    width={width}
                    setWidth={setWidth}
                    targetColor={targetColor}
                    setTargetColor={setTargetColor}
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    isGenerating={isGenerating}
                    handleImageUpload={handleImageUpload}
                />
            </div>

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
                    <div className="bg-purple-600 shadow-[0_0_50px_rgba(147,51,234,0.5)] text-white px-8 py-4 rounded-[2rem] border border-purple-400 flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Check size={20} className="text-white" />
                        </div>
                        <div className="font-black uppercase tracking-widest text-xs">
                            <span className="text-white">"{cartFeedback}"</span> successfully added to cart
                        </div>
                    </div>
                </div>
            )}

            {/* Save Feedback Toast */}
            {saveFeedback && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-gray-900/90 backdrop-blur-md text-white px-8 py-4 rounded-3xl shadow-2xl border border-white/20 flex items-center gap-4">
                        <div className="bg-green-500 p-2 rounded-full">
                            <Check size={20} className="text-white" />
                        </div>
                        <div className="font-bold">
                            <span className="text-purple-300">"{saveFeedback}"</span> successfully archived to Blueprints!
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatPage;