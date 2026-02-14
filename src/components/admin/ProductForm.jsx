import React from 'react';
import { Wand2, Upload, Loader2, Plus, Package, Calculator } from 'lucide-react';
import Button from '../ui/Button';

const ProductForm = ({
    formData,
    handleInputChange,
    generateAIContent,
    isGenerating,
    handleSubmit,
    generatedImage,
    calculatedPrice
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fadeIn">
            {/* Input Form */}
            <div className="bg-gray-950/50 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-purple-600/10 transition-colors duration-1000"></div>

                <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-white uppercase tracking-tighter">
                    <Wand2 className="text-purple-500" /> AI Neural Synthesis
                </h3>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-1">Target Visualization</label>
                        <div className="border-2 border-dashed border-white/10 rounded-3xl p-8 text-center hover:border-purple-500/50 transition-all bg-white/5 cursor-pointer relative group/upload">
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleInputChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="pointer-events-none">
                                <Upload className="mx-auto text-purple-500 mb-4 group-hover/upload:scale-110 transition-transform" size={32} />
                                <p className="text-white font-black text-sm uppercase tracking-widest">Upload Blueprint</p>
                                <p className="text-gray-600 text-[10px] mt-2 font-bold whitespace-nowrap">PNG, JPG or WEBP (MAX. 800x800)</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-1">Mass Flux (g)</label>
                            <input
                                required
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleInputChange}
                                placeholder="0"
                                className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-700"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-1">Temporal Cost (h)</label>
                            <input
                                required
                                type="number"
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                                placeholder="0.0"
                                step="0.1"
                                className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-700"
                            />
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={generateAIContent}
                        disabled={!formData.image || isGenerating}
                        className="w-full py-6 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_10px_40px_-10px_rgba(168,85,247,0.5)] font-black uppercase tracking-[0.2em] text-sm"
                    >
                        {isGenerating ? (
                            <><Loader2 className="animate-spin" /> Neural Sync Active...</>
                        ) : (
                            <><Wand2 size={20} /> Deploy Gemini AI</>
                        )}
                    </Button>

                    <div className="h-px bg-white/5 my-4"></div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-1">Unit Assignment</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Awaiting Signal..."
                                className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-black text-white placeholder-gray-700 uppercase tracking-tighter text-xl"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-1">Classification Pool</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                placeholder="Classifying..."
                                className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-purple-400 placeholder-gray-700 uppercase tracking-widest text-xs"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-1">Technical Brief</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Scanning..."
                                className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none h-32 resize-none font-medium text-gray-400 placeholder-gray-700 text-sm leading-relaxed"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={!calculatedPrice || !formData.name}
                        className="w-full py-8 text-xl shadow-[0_20px_50px_-15px_rgba(255,255,255,0.1)] group"
                    >
                        <Plus size={24} className="mr-3 inline group-hover:rotate-90 transition-transform" /> Commit to Inventory
                    </Button>
                </form>
            </div>

            {/* Preview Section */}
            <div className="space-y-10">
                <div className="bg-gray-950/30 rounded-[3rem] aspect-square flex items-center justify-center overflow-hidden border border-white/10 relative shadow-inner group">
                    {generatedImage ? (
                        <>
                            <img src={generatedImage} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                            <div className="absolute top-6 right-6 bg-purple-600/90 backdrop-blur-xl text-white text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xl uppercase tracking-[0.2em] border border-white/10">
                                <Wand2 size={14} className="animate-pulse" /> Gemini Enhanced
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent"></div>
                        </>
                    ) : (
                        <div className="text-gray-700 text-center">
                            <Package size={64} className="mx-auto mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-[0.3em] text-xs">Awaiting Visualization</p>
                            <p className="text-[10px] uppercase font-bold text-gray-800 mt-2">Initialize sensor data</p>
                        </div>
                    )}
                </div>

                {calculatedPrice && (
                    <div className="bg-gray-950/80 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl animate-fadeIn relative overflow-hidden group">
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>

                        <div className="flex items-center gap-4 mb-10 text-purple-400">
                            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                <Calculator size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-white uppercase tracking-tighter text-xl">Material Logic</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest italic text-gray-500">Resource Consumption Matrix</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs font-black uppercase tracking-widest">
                            {[
                                { label: 'Polymer Flux', val: calculatedPrice.breakdown.plastic },
                                { label: 'Thermal Window', val: calculatedPrice.breakdown.machine },
                                { label: 'Operator Override', val: calculatedPrice.breakdown.labor }
                            ].map(stat => (
                                <div key={stat.label} className="flex justify-between items-center group/item">
                                    <span className="text-gray-600 group-hover/item:text-gray-400 transition-colors">{stat.label}</span>
                                    <span className="text-white">${stat.val}</span>
                                </div>
                            ))}

                            <div className="h-px bg-white/5 my-4"></div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white">NET PRODUCTION</span>
                                <span className="text-white">${calculatedPrice.breakdown.production}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-purple-400">MARGIN TARGET</span>
                                <span className="text-purple-400">+${calculatedPrice.breakdown.profit}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600 italic">
                                <span>EXTERIOR FEES</span>
                                <span>+${(Number(calculatedPrice.breakdown.shipping) + Number(calculatedPrice.breakdown.fees)).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Retail Optimization</p>
                            <p className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                ${calculatedPrice.finalPrice}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductForm;
