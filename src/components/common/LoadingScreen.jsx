import React from 'react';
import { Package } from 'lucide-react';

const LoadingScreen = ({ isLoading }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-[#030014] flex flex-col items-center justify-center animate-fadeIn">
            <div className="relative mb-8">
                <div className="w-24 h-24 border-2 border-purple-500/20 rounded-[2rem] animate-spin duration-[3000ms]"></div>
                <div className="absolute inset-0 flex items-center justify-center text-purple-500 animate-pulse">
                    <Package size={40} />
                </div>
                <div className="absolute -inset-4 bg-purple-500/10 blur-2xl rounded-full"></div>
            </div>
            <div className="text-center">
                <h2 className="text-xl font-black uppercase tracking-[0.5em] text-white mb-2">Synchronizing</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 opacity-50">Connecting to Fabrication Cluster...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
