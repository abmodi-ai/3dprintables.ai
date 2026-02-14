import React, { useState } from 'react';
import { X, Zap, Award, Gift, TrendingUp, Info, Activity, Terminal } from 'lucide-react';
import Button from '../ui/Button';
import { playClink, playHum } from '../../utils/sounds';

const CreditsModal = ({ isOpen, onClose, user }) => {
    const [activeDiagnostic, setActiveDiagnostic] = useState(null);

    if (!isOpen) return null;

    const discountTiers = [
        {
            id: 'thermal',
            title: "Thermal Recruit",
            requirement: "Initial Activation",
            benefit: "10.00 CR Welcome Grant",
            detail: "System has successfully provisioned 10.00 Laboratory Credits to your account as a startup incentive. These are available for immediate use at checkout.",
            icon: <Gift className="text-purple-400" />,
            status: user?.credits >= 0 ? "Active" : "Locked"
        },
        {
            id: 'engineer',
            title: "Elite Engineer",
            requirement: "50+ Career Prints",
            benefit: "15% Credit-Back + Zero Delivery Fees",
            detail: "Elite logistics protocol activated. High-volume engineers unlock 15% credit yields and automated zero-cost delivery across all physical sectors once they cross the 50-print threshold.",
            icon: <Award className="text-amber-400" />,
            status: user?.orderCount >= 50 ? "Active" : "Locked"
        },
        {
            id: 'master',
            title: "Fabrication Master",
            requirement: "200+ Career Prints",
            benefit: "25% Credit-Back + Instant Prototype Access",
            detail: "The ultimate laboratory standing. Maximum credit harvesting efficiency and priority access to unreleased AI fabrication models.",
            icon: <Zap className="text-pink-500" />,
            status: "Coming Soon"
        }
    ];

    const handleTierClick = (tier) => {
        playClink();
        setActiveDiagnostic(tier.id === activeDiagnostic ? null : tier.id);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-[#0a0a1a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.2)] animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Vault <span className="text-purple-500">Inventory</span></h2>
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.3em] mt-1">Laboratory Credit Allocation</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white border border-white/10">
                        <X size={24} />
                    </button>
                </div>

                {/* Balance Display */}
                <div className="p-8 relative z-10">
                    <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 p-10 rounded-[2.5rem] text-center mb-8 shadow-2xl relative group overflow-hidden" onMouseEnter={playHum}>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mb-4 block">Current Liquidity</span>
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                {user?.credits?.toFixed(2) || '0.00'}
                            </span>
                            <div className="flex flex-col items-start">
                                <span className="bg-purple-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-900/50">Credits</span>
                                <span className="text-[10px] text-gray-500 font-bold mt-1">Value: 1 CR = $1.00</span>
                            </div>
                        </div>
                    </div>

                    {/* Diagnostic Screen (If a tier is clicked) */}
                    {activeDiagnostic && (
                        <div className="mb-6 bg-purple-500/10 border border-purple-500/30 p-6 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <Terminal size={14} className="text-purple-400" />
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Protocol Diagnostic Log</span>
                            </div>
                            <p className="text-sm text-gray-300 font-bold leading-relaxed">
                                {discountTiers.find(t => t.id === activeDiagnostic)?.detail}
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-green-400 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                                Synchronization Nominal
                            </div>
                        </div>
                    )}

                    {/* Discount Programs */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] pl-2 flex items-center gap-2">
                            <Activity size={12} /> Optimization Protocols (Click for Detail)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {discountTiers.map((tier, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleTierClick(tier)}
                                    disabled={tier.status === 'Coming Soon'}
                                    className={`p-6 rounded-[2rem] border transition-all duration-500 relative group/tier text-left w-full overflow-hidden ${activeDiagnostic === tier.id
                                        ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)] scale-[1.02]'
                                        : tier.status === 'Coming Soon'
                                            ? 'bg-gray-950/40 border-white/5 opacity-60 grayscale cursor-not-allowed'
                                            : 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-lg group-hover/tier:scale-110 transition-transform">
                                            {tier.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white text-sm uppercase tracking-tight">{tier.title}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {(tier.status === 'Active' || tier.status === 'Global Protocol') && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                                )}
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${tier.status === 'Active' || tier.status === 'Global Protocol' ? 'text-green-400' : 'text-gray-500'
                                                    }`}>
                                                    {tier.status === 'Active' || tier.status === 'Global Protocol' ? 'Protocol Online' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-purple-400 uppercase tracking-widest leading-relaxed">
                                        {tier.benefit}
                                    </p>
                                    <div className="mt-3 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em]">
                                        <span className="text-gray-600">Click to Diagnostic</span>
                                        {tier.status === 'Coming Soon' ? null : (
                                            <span className="text-purple-500/40">READY</span>
                                        )}
                                    </div>

                                    {/* Click Effect Overlay */}
                                    <div className={`absolute inset-0 bg-white/10 pointer-events-none transition-opacity duration-300 ${activeDiagnostic === tier.id ? 'opacity-100' : 'opacity-0'}`}></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-8 border-t border-white/5 bg-white/5 relative z-10 flex justify-center">
                    <Button onClick={onClose} className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black uppercase tracking-widest text-xs">
                        Dismiss Data View
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreditsModal;
