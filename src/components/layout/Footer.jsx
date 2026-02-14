import React from 'react';
import { Package } from 'lucide-react';

const Footer = ({ setView }) => (
    <footer className="bg-gray-950/80 backdrop-blur-xl text-white pt-24 pb-12 mt-auto border-t border-white/5 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                            <Package size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase">Print<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Palooza</span></span>
                    </div>
                    <p className="text-gray-500 leading-relaxed font-bold uppercase tracking-widest text-[10px] max-w-sm italic">
                        Initializing the next generation of 3D fabrication. We merge neural-link creativity with quantum-layer precision to deliver toys from the future.
                    </p>
                </div>
                <div>
                    <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-gray-400">Navigation Core</h4>
                    <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest">
                        <li><button onClick={() => setView('home')} className="text-gray-500 hover:text-white transition-all flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors"></span>Home Sequence</button></li>
                        <li><button onClick={() => setView('ai-lab')} className="text-gray-500 hover:text-white transition-all flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors"></span>AI Synthesis Lab</button></li>
                        <li><button onClick={() => setView('admin')} className="text-purple-400 hover:text-purple-300 transition-all flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>Command Center</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-gray-400">Comms Link</h4>
                    <p className="text-gray-600 mb-6 text-[10px] font-bold uppercase tracking-widest">Subscribe for direct data drops.</p>
                    <div className="flex gap-2">
                        <input type="email" placeholder="NEURAL_PATH@EMAIL.COM" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full focus:border-purple-500 focus:bg-white/10 outline-none transition-all text-[10px] font-black text-white placeholder-gray-700" />
                        <button className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-purple-900/20 active:scale-95">Link</button>
                    </div>
                </div>
            </div>
            <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] text-center md:text-left">
                    © 2024 PRINT-PALOOZA NEURAL CLUSTER. ALL DATA LOGGED.
                </div>
                <div className="flex gap-8 text-[10px] font-black text-gray-700 uppercase tracking-widest">
                    <span className="hover:text-purple-500 cursor-pointer transition-colors">Privacy Protocol</span>
                    <span className="hover:text-purple-500 cursor-pointer transition-colors">Terms of Service</span>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;
