import React from 'react';
import { ShoppingCart, Wand2, Menu, X, User as UserIcon, LogIn, LogOut, Zap } from 'lucide-react';

const Navbar = ({ cartCount, setView, mobileMenuOpen, setMobileMenuOpen, user, logout, openAuth }) => (
    <nav className="sticky top-0 z-50 bg-[#030014]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            {/* Logo */}
            <div
                onClick={() => setView('home')}
                className="flex items-center gap-3 cursor-pointer group"
            >
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-2xl text-white transform group-hover:rotate-12 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]">
                    <Wand2 size={26} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black text-white tracking-tighter leading-none">
                        3D<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Printables</span><span className="text-purple-400 text-sm">.ai</span>
                    </span>
                </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10 font-black text-sm uppercase tracking-widest text-gray-400">
                <button onClick={() => setView('home')} className="hover:text-purple-400 transition-all">Design</button>
                <button onClick={() => setView('our-story')} className="hover:text-purple-400 transition-all">Our Story</button>
                {user && (
                    <button onClick={() => setView('account')} className="hover:text-white transition-all">Orders</button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {user ? (
                    <div className="hidden md:flex items-center gap-4">
                        <div
                            onClick={() => setView('account')}
                            className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 cursor-pointer hover:border-purple-500/50 transition-all font-bold text-white group/user"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs shadow-lg group-hover/user:scale-110 transition-transform">
                                <UserIcon size={16} />
                            </div>
                            <span className="text-sm">{user.fullName.split(' ')[0]}</span>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={openAuth}
                        className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    >
                        <LogIn size={20} /> Sign In
                    </button>
                )}

                <button
                    onClick={() => setView('cart')}
                    className="relative bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all text-purple-400 border border-white/10 hover:border-purple-500/30"
                >
                    <ShoppingCart size={22} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-pink-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#030014] animate-pulse">
                            {cartCount}
                        </span>
                    )}
                </button>

                <button
                    className="md:hidden text-gray-400"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
            <div className="md:hidden bg-[#0a0a1a] border-t border-white/10 p-6 flex flex-col gap-6 font-black text-sm uppercase tracking-widest text-gray-400 animate-slideDown">
                <button onClick={() => { setView('home'); setMobileMenuOpen(false); }} className="p-2 text-purple-400 transition-all text-left">Design</button>
                <button onClick={() => { setView('our-story'); setMobileMenuOpen(false); }} className="p-2 hover:text-purple-400 transition-all text-left">Our Story</button>

                {user ? (
                    <>
                        <button onClick={() => { setView('account'); setMobileMenuOpen(false); }} className="p-2 hover:text-white transition-all text-left">Orders</button>
                        <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="p-2 text-pink-500 transition-all text-left flex items-center gap-2">
                            <LogOut size={18} /> Sign Out
                        </button>
                    </>
                ) : (
                    <button onClick={() => { openAuth(); setMobileMenuOpen(false); }} className="p-2 text-purple-400 transition-all text-left flex items-center gap-2">
                        <LogIn size={18} /> Sign In
                    </button>
                )}

            </div>
        )}
    </nav>
);

export default Navbar;
