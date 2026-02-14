import React from 'react';
import { Wand2 } from 'lucide-react';
import Button from '../ui/Button';

const Hero = ({ setView }) => (
    <div className="relative overflow-hidden pt-24 pb-32">
        {/* Animated Glows */}
        <div className="absolute top-20 right-[10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-20 left-[10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse animation-delay-2000"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tighter">
                Engineer the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 neon-glow-purple">
                    Impossible.
                </span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button onClick={() => setView('ai-lab')} className="text-xl px-10 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-all shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] flex items-center gap-3">
                    <Wand2 size={24} className="animate-spin-slow" />
                    Enter the Lab
                </Button>
            </div>
        </div>
    </div>
);

export default Hero;
