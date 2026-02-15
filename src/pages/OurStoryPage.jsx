import React from 'react';
import { ArrowRight, Lightbulb, Cpu, MessageSquare, Pen, DollarSign, Truck, Star, MapPin, Heart, Sparkles } from 'lucide-react';

const OurStoryPage = ({ setView }) => {
    const steps = [
        {
            icon: <MessageSquare size={24} />,
            title: 'Describe Your Idea',
            description: 'Tell us what you want — a custom phone stand, a gift for someone, a game piece, anything! Use our AI chat to describe your idea in your own words.'
        },
        {
            icon: <Cpu size={24} />,
            title: 'AI Generates a Preview',
            description: 'Our AI creates a visual preview of your idea so you can see what it could look like before anything gets printed.'
        },
        {
            icon: <Lightbulb size={24} />,
            title: 'Confirm Your Design',
            description: 'Review the AI-generated preview. Want changes? Just tell us! Once you\'re happy with the design, confirm it.'
        },
        {
            icon: <Pen size={24} />,
            title: 'Arav Designs the 3D Model',
            description: 'Arav takes your confirmed design and uses professional 3D modeling tools to create a precise, printable 3D model.'
        },
        {
            icon: <DollarSign size={24} />,
            title: 'Get Your Quote',
            description: 'Arav sends you a quote based on the size, complexity, and materials. No surprises — you know the price before anything prints.'
        },
        {
            icon: <Truck size={24} />,
            title: 'We Print & Ship',
            description: 'Once you confirm the quote, Arav prints your custom creation and ships it right to your door!'
        }
    ];

    const funFacts = [
        { icon: <Star size={20} />, text: 'Philadelphia Eagles superfan' },
        { icon: <MapPin size={20} />, text: 'Based in Greater Philadelphia' },
        { icon: <Heart size={20} />, text: 'Loves creating innovative 3D objects' },
        { icon: <Sparkles size={20} />, text: 'Started 3D printing at age 8' },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Banner */}
            <section className="relative overflow-hidden pt-28 pb-20">
                <div className="absolute top-10 right-[10%] w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute -bottom-20 left-[5%] w-80 h-80 bg-pink-600/15 rounded-full blur-[100px] animate-pulse"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400 mb-4">About Us</p>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                        Our Story
                    </h1>
                    <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-6 rounded-full"></div>
                </div>
            </section>

            {/* Meet Arav Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
                        {/* Photo Placeholder */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[2.5rem] opacity-40 blur-xl"></div>
                                <div className="relative w-64 h-64 md:w-72 md:h-72 bg-gradient-to-b from-[#0a0020] to-[#030014] rounded-[2.5rem] border-2 border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
                                    <img
                                        src="/img/arav.png"
                                        alt="Arav — Founder of 3DPrintables.ai"
                                        className="w-full h-full object-cover object-top scale-110"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
                                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Arav</span>
                            </h2>
                            <p className="text-gray-400 text-lg leading-relaxed mb-4 font-medium">
                                I'm Arav, a 9-year-old inventor, maker, and 3D printing enthusiast from Greater Philadelphia. I love turning creative ideas into real, physical objects you can hold in your hands.
                            </p>
                            <p className="text-gray-400 text-lg leading-relaxed font-medium">
                                When I'm not designing and printing cool stuff, you'll probably find me cheering for the <span className="text-green-400 font-bold">Philadelphia Eagles</span> or coming up with my next big idea!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Vision */}
            <section className="py-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400 mb-4">The Vision</p>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8">
                            Why I Started This
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-6 font-medium">
                            I realized that getting custom 3D-printed stuff shouldn't be limited to what's already on a marketplace. What if you could just <span className="text-white font-bold">describe</span> exactly what you want — and someone would actually make it for you?
                        </p>
                        <p className="text-gray-400 text-lg leading-relaxed font-medium">
                            That's why I built <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold">3DPrintables.ai</span>. With the power of AI, you can describe your idea, see a preview, and then I'll personally design, print, and ship your custom creation. It's your imagination, brought to life.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works — 6 Steps */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400 mb-4">The Process</p>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            How It Works
                        </h2>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-900/60 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                            {step.icon}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Step {idx + 1}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-3 tracking-tight">{step.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed font-medium">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Fun Facts */}
            <section className="py-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-900/5 to-transparent pointer-events-none"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400 mb-4">Fun Facts</p>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            A Little More About Me
                        </h2>
                    </div>

                    <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {funFacts.map((fact, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-4 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-5 hover:border-purple-500/20 transition-all"
                            >
                                <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center text-purple-400 flex-shrink-0">
                                    {fact.icon}
                                </div>
                                <span className="text-gray-300 font-bold text-sm">{fact.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
                        Ready to Bring Your Idea to Life?
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto font-medium">
                        Describe what you want, and I'll design and 3D print it just for you.
                    </p>
                    <button
                        onClick={() => setView('home')}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)]"
                    >
                        Start Designing <ArrowRight size={22} />
                    </button>
                </div>
            </section>
        </div>
    );
};

export default OurStoryPage;
