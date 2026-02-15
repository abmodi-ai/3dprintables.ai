import React from 'react';
import { Wand2, MessageSquare, Package } from 'lucide-react';

const steps = [
    {
        icon: MessageSquare,
        title: 'Describe Your Idea',
        description: 'Tell our AI what you want to create. Upload a sketch or just describe it in words.',
        color: 'from-purple-500 to-indigo-600',
        glow: 'rgba(147, 51, 234, 0.3)',
    },
    {
        icon: Wand2,
        title: 'AI Generates Your Design',
        description: 'Our AI creates a detailed 3D design preview with accurate pricing in seconds.',
        color: 'from-pink-500 to-rose-600',
        glow: 'rgba(236, 72, 153, 0.3)',
    },
    {
        icon: Package,
        title: 'We Print & Ship',
        description: 'Approve your design, and we 3D print it with premium materials and ship it to your door.',
        color: 'from-blue-500 to-cyan-600',
        glow: 'rgba(59, 130, 246, 0.3)',
    },
];

const HowItWorks = () => (
    <section className="py-24 relative">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    How It Works
                </h2>
                <p className="text-gray-400 font-bold max-w-lg mx-auto">
                    From idea to your doorstep in three simple steps.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {steps.map((step, idx) => (
                    <div
                        key={idx}
                        className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 text-center group hover:border-purple-500/30 transition-all duration-500"
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-950 border border-white/10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-purple-400">
                            {idx + 1}
                        </div>
                        <div
                            className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}
                            style={{ boxShadow: `0 10px 30px ${step.glow}` }}
                        >
                            <step.icon size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                        <p className="text-gray-400 font-medium leading-relaxed text-sm">{step.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default HowItWorks;
