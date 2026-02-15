import React from 'react';
import { Palette, Sparkles } from 'lucide-react';

const ColorModal = ({ isColorModalOpen, productToEdit, setIsColorModalOpen, customColor, setCustomColor, confirmColorChange }) => {
    if (!isColorModalOpen || !productToEdit) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsColorModalOpen(false)}
            ></div>
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                        <Palette size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Change Color</h3>
                        <p className="text-sm text-gray-500 font-bold">New look for "{productToEdit.name}"</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Preset</label>
                        <div className="grid grid-cols-5 gap-2">
                            {[
                                { name: 'Neon Green', hex: '#39ff14' },
                                { name: 'Hot Pink', hex: '#ff69b4' },
                                { name: 'Cyan', hex: '#00ffff' },
                                { name: 'Gold', hex: '#ffd700' },
                                { name: 'Silver', hex: '#c0c0c0' },
                                { name: 'Matte Black', hex: '#1a1a1a' },
                                { name: 'White', hex: '#ffffff' },
                                { name: 'Orange', hex: '#ffa500' },
                                { name: 'Purple', hex: '#800080' },
                                { name: 'Red', hex: '#ff0000' }
                            ].map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setCustomColor(color.name)}
                                    className="w-full aspect-square rounded-full border-2 border-gray-100 hover:scale-110 transition-transform shadow-sm relative group"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                >
                                    {customColor === color.name && <div className="absolute inset-0 flex items-center justify-center text-white/50"><Sparkles size={12} fill="currentColor" /></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Or Custom Color</label>
                        <input
                            type="text"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            placeholder="e.g. Iridescent Blue..."
                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-300 outline-none font-bold text-gray-700 placeholder-gray-300"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsColorModalOpen(false)}
                        className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmColorChange}
                        disabled={!customColor}
                        className="flex-[2] py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-200"
                    >
                        Apply Color
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ColorModal;
