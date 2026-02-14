import React from 'react';
import { User as UserIcon, LogOut } from 'lucide-react';

const AccountHeader = ({ user, logout, activeTab, setActiveTab }) => {
    return (
        <div className="bg-gray-950/50 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 border border-white text-white shadow-2xl mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                        <UserIcon size={40} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight">{user.fullName}</h2>
                        <p className="text-purple-400 font-bold flex items-center gap-2 text-sm mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            Account Active
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-6 py-5 rounded-3xl bg-white/5 text-gray-400 font-bold hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-white/10 hover:border-rose-500/20"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-12 flex gap-4 border-t border-white/5 pt-8">
                <button
                    onClick={() => setActiveTab('manifests')}
                    className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'manifests'
                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                        : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/5'}`}
                >
                    Project Manifests
                </button>
                <button
                    onClick={() => setActiveTab('blueprints')}
                    className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'blueprints'
                        ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                        : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/5'}`}
                >
                    Saved Blueprints
                </button>
            </div>
        </div>
    );
};

export default AccountHeader;
