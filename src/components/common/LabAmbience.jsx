import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Activity } from 'lucide-react';
import { startLabAmbient } from '../../utils/sounds';

const LabAmbience = () => {
    const [isActive, setIsActive] = useState(false);
    const [stopFn, setStopFn] = useState(null);

    const toggleAmbience = () => {
        if (isActive) {
            if (stopFn) stopFn();
            setStopFn(null);
            setIsActive(false);
        } else {
            const stop = startLabAmbient();
            setStopFn(() => stop);
            setIsActive(true);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stopFn) stopFn();
        };
    }, [stopFn]);

    return (
        <div className="fixed bottom-8 left-8 z-[60] flex items-center gap-3">
            <button
                onClick={toggleAmbience}
                className={`p-4 rounded-full border transition-all duration-500 shadow-2xl flex items-center justify-center group ${isActive
                        ? 'bg-purple-600 border-purple-400 text-white shadow-purple-500/50 scale-110'
                        : 'bg-gray-900 border-white/10 text-gray-500 hover:text-white hover:border-purple-500/30'
                    }`}
                title={isActive ? "Deactivate Lab Ambience" : "Initialize Lab Ambience"}
            >
                {isActive ? <Volume2 size={20} className="animate-pulse" /> : <VolumeX size={20} />}
            </button>

            {isActive && (
                <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl animate-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                            Ambient Loop: <span className="text-white">Active</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabAmbience;
