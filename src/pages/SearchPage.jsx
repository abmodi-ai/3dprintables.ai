import React from 'react';
import { Sparkles, ArrowRight, Rocket } from 'lucide-react';

const SearchPage = ({ setView }) => {
    return (
        <div className="container mx-auto px-4 py-16 sm:py-24 min-h-[80vh] flex flex-col items-center justify-center text-center">
            {/* Animated Glows */}
            <div className="absolute top-[30%] right-[15%] w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[10%] w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-pink-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl mx-auto">
                {/* Icon */}
                <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-600 to-pink-500 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                        <Rocket size={40} className="text-white sm:hidden" />
                        <Rocket size={56} className="text-white hidden sm:block" />
                    </div>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                    <Sparkles size={14} className="text-purple-400 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-[0.3em]">Coming Soon</span>
                    <Sparkles size={14} className="text-purple-400 animate-pulse" />
                </div>

                {/* Heading */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tighter leading-tight">
                    Browse <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500">Products</span>
                </h1>

                {/* Description */}
                <p className="text-base sm:text-lg text-gray-400 max-w-lg mx-auto mb-8 sm:mb-10 leading-relaxed font-medium px-4">
                    We're building a marketplace where you can browse pre-designed 3D printable creations.
                    In the meantime, describe any idea and we'll bring it to life!
                </p>

                {/* CTA */}
                <button
                    onClick={() => setView('home')}
                    className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] group"
                >
                    Design Something Custom
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform sm:hidden" />
                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform hidden sm:block" />
                </button>

                {/* Decorative dots */}
                <div className="mt-12 sm:mt-16 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500/30"></div>
                    <div className="w-2 h-2 rounded-full bg-pink-500/30"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500/30"></div>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
