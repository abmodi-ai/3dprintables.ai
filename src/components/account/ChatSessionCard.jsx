import React from 'react';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { playHum } from '../../utils/sounds';

const ChatSessionCard = ({ session, onView }) => {
    const messageCount = session.messageCount || 0;
    const lastMessage = session.lastMessage || 'No messages yet';
    const truncatedPreview = lastMessage.length > 80 ? lastMessage.substring(0, 77) + '...' : lastMessage;

    return (
        <div
            className="bg-[#05001a] rounded-xl sm:rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden group hover:border-purple-500/50 transition-all duration-500 cursor-pointer relative"
            onClick={() => onView(session.id)}
            onMouseEnter={playHum}
        >
            <div className="floor-glow" style={{ '--glow-color': 'rgba(168, 85, 247, 0.3)' }}></div>
            <div className="p-4 sm:p-6 md:p-8">
                <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <MessageSquare size={14} className="sm:hidden" />
                            <MessageSquare size={18} className="hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-black text-white text-sm sm:text-base leading-tight truncate">{session.title || 'Design Chat'}</h4>
                            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                                <span className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                    {messageCount} msg{messageCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest">
                            {new Date(session.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed truncate">{truncatedPreview}</p>
                </div>
            </div>

            <div className="bg-white/5 px-4 sm:px-8 py-2.5 sm:py-3 border-t border-white/5 flex items-center justify-between group-hover:bg-purple-600 transition-colors duration-500">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock size={12} className="text-gray-500 group-hover:text-purple-200 sm:hidden" />
                    <Clock size={14} className="text-gray-500 group-hover:text-purple-200 hidden sm:block" />
                    <span className="text-[9px] sm:text-[10px] font-black text-gray-500 tracking-widest group-hover:text-purple-200 uppercase">
                        {new Date(session.updated_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 group-hover:text-white transition-colors">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">View</span>
                    <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform sm:hidden" />
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform hidden sm:block" />
                </div>
            </div>
        </div>
    );
};

export default ChatSessionCard;
