import React from 'react';
import { Wand2, Trash2 } from 'lucide-react';
import { playHum } from '../../utils/sounds';

const ChatHeader = ({ setMessages }) => {
    return (
        <div className="bg-white/5 backdrop-blur-md border-b border-white/10 p-6 sm:p-8 flex items-center justify-between z-10">
            <div className="flex items-center gap-5">
                <div className="relative">
                    <div className="bg-gradient-to-tr from-purple-600 to-pink-500 p-3.5 rounded-2xl text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] animate-in spin-in-12 duration-1000">
                        <Wand2 size={26} strokeWidth={2.5} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-950 rounded-full animate-pulse shadow-sm"></div>
                </div>
                <div>
                    <h2 className="font-black text-2xl text-white tracking-tight leading-none mb-1.5 flex items-center gap-2">
                        AI Creation Lab
                        <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30">EXPERIMENTAL</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">SYNCHRONIZING TELEMETRY</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">• Engineering Mode</span>
                    </div>
                </div>
            </div>
            <button
                onClick={() => { playHum(); setMessages([{ role: 'assistant', content: 'Design session reset. What should we create next?' }]); }}
                className="p-3 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-500/20"
                title="Reset Design Session"
            >
                <Trash2 size={22} />
            </button>
        </div>
    );
};

export default ChatHeader;
