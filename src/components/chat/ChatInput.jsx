import React from 'react';
import { Ruler, Palette, Camera, Send, Loader2, X } from 'lucide-react';
import { playHum, playClink } from '../../utils/sounds';

const ChatInput = ({
    uploadedImage,
    setUploadedImage,
    length,
    setLength,
    width,
    setWidth,
    targetColor,
    setTargetColor,
    input,
    setInput,
    handleSend,
    isGenerating,
    handleImageUpload
}) => {
    return (
        <div className="p-8 sm:p-10 bg-gray-950/80 backdrop-blur-3xl border-t border-white/5 z-10 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/5 to-transparent pointer-events-none"></div>
            <div className="max-w-3xl mx-auto space-y-6">
                {uploadedImage && (
                    <div className="flex flex-col gap-4 animate-in zoom-in duration-300">
                        <div className="relative inline-block group self-start">
                            <div className="w-28 h-28 p-1.5 bg-white rounded-3xl border border-purple-200 shadow-2xl relative overflow-hidden">
                                <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <button onClick={() => {
                                setUploadedImage(null);
                            }} className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-2.5 shadow-xl hover:bg-rose-600 transition-all hover:scale-110 border-4 border-white z-20">
                                <X size={14} strokeWidth={4} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 animate-in fade-in duration-500 shadow-inner space-y-6">
                    <div className="flex flex-wrap items-center gap-8">
                        {/* Material label or spacers if needed */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Palette size={12} className="text-purple-400" />
                                Selection Palette
                            </span>
                        </div>
                    </div>

                    {/* Pre-set Material Console */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
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
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${targetColor === mat.name
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
                <div className="flex gap-4 items-end bg-gray-900/90 hover:bg-gray-900 p-3 rounded-[2.5rem] border border-white/10 hover:border-purple-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] focus-within:ring-2 focus-within:ring-purple-500/30 transition-all duration-500 group/input-container">
                    <div className="relative p-1">
                        <input type="file" id="img-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        <label htmlFor="img-upload" className="w-14 h-14 bg-gray-950 text-gray-500 rounded-[1.25rem] hover:bg-purple-500/10 hover:text-purple-400 cursor-pointer transition-all flex items-center justify-center border border-white/5 flex-shrink-0" title="Upload inspiration image">
                            <Camera size={26} strokeWidth={2} />
                        </label>
                    </div>
                    <textarea
                        rows="1"
                        placeholder="Describe your vision..."
                        className="flex-1 bg-transparent border-none py-4 px-2 focus:ring-0 outline-none font-bold text-white placeholder-gray-600 resize-none min-h-[60px] max-h-40 leading-relaxed scrollbar-hide text-lg"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { playClink(); e.preventDefault(); handleSend(); }
                        }}
                    />
                    <button onClick={() => { playClink(); handleSend(); }} disabled={isGenerating || (!input.trim() && !uploadedImage)} className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all">
                        {isGenerating ? <Loader2 size={26} className="animate-spin" /> : <Send size={26} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
