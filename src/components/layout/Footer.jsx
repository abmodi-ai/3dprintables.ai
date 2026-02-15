import React, { useState } from 'react';
import { Package, Check, AlertCircle } from 'lucide-react';
import LegalModal from '../common/LegalModal';

const Footer = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState(null); // 'success' | 'error' | null
    const [legalModal, setLegalModal] = useState(null); // 'privacy' | 'terms' | null

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@') || !email.includes('.')) {
            setSubscribeStatus('error');
            setTimeout(() => setSubscribeStatus(null), 3000);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                setSubscribeStatus('success');
                setEmail('');
            } else {
                setSubscribeStatus('error');
            }
        } catch (err) {
            console.error('Newsletter subscribe failed:', err);
            setSubscribeStatus('error');
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSubscribeStatus(null), 4000);
        }
    };

    return (
        <>
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
                                <span className="text-2xl font-black tracking-tighter">3D<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Printables</span><span className="text-purple-400 text-sm">.ai</span></span>
                            </div>
                            <p className="text-gray-500 leading-relaxed font-bold uppercase tracking-widest text-[10px] max-w-sm italic">
                                Custom 3D prints designed by AI, crafted by Arav. From your imagination to your doorstep.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-gray-400">Quick Links</h4>
                            <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest">
                                <li><button onClick={() => setView('home')} className="text-gray-500 hover:text-white transition-all flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors"></span>Home</button></li>
                                <li><button onClick={() => setView('home')} className="text-gray-500 hover:text-white transition-all flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors"></span>Design Studio</button></li>
                                <li><button onClick={() => setView('our-story')} className="text-gray-500 hover:text-white transition-all flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors"></span>Our Story</button></li>
                                <li><button onClick={() => setView('search')} className="text-gray-500 hover:text-white transition-all flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors"></span>Browse Products</button></li>
                                <li><button onClick={() => setView('account')} className="text-gray-500 hover:text-white transition-all flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-500 transition-colors"></span>My Account</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-gray-400">Newsletter</h4>
                            <p className="text-gray-600 mb-6 text-[10px] font-bold uppercase tracking-widest">Subscribe for updates.</p>
                            <form onSubmit={handleSubscribe} className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full focus:border-purple-500 focus:bg-white/10 outline-none transition-all text-[10px] font-black text-white placeholder-gray-700"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-purple-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? '...' : 'Subscribe'}</button>
                            </form>
                            {subscribeStatus === 'success' && (
                                <div className="flex items-center gap-2 mt-3 animate-in fade-in duration-300">
                                    <Check size={14} className="text-green-400" />
                                    <span className="text-[10px] font-bold text-green-400">Thanks for subscribing!</span>
                                </div>
                            )}
                            {subscribeStatus === 'error' && (
                                <div className="flex items-center gap-2 mt-3 animate-in fade-in duration-300">
                                    <AlertCircle size={14} className="text-rose-400" />
                                    <span className="text-[10px] font-bold text-rose-400">Please enter a valid email address.</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] text-center md:text-left">
                            &copy; {new Date().getFullYear()} 3DPrintables.ai. All rights reserved.
                        </div>
                        <div className="flex gap-8 text-[10px] font-black text-gray-700 uppercase tracking-widest">
                            <button onClick={() => setLegalModal('privacy')} className="hover:text-purple-500 cursor-pointer transition-colors">Privacy Policy</button>
                            <button onClick={() => setLegalModal('terms')} className="hover:text-purple-500 cursor-pointer transition-colors">Terms of Service</button>
                        </div>
                    </div>
                </div>
            </footer>

            <LegalModal
                isOpen={legalModal !== null}
                onClose={() => setLegalModal(null)}
                type={legalModal}
            />
        </>
    );
};

export default Footer;
