import React, { useState } from 'react';
import { Send, Clock, CheckCircle, X, MessageSquare } from 'lucide-react';
import { playHum } from '../../utils/sounds';

const OrderManifest = ({ order, onViewChat }) => {
    const [lightboxImage, setLightboxImage] = useState(null);
    const [lightboxName, setLightboxName] = useState('');

    const isQuote = order.id.startsWith('quote_');
    const statusLabel = isQuote ? 'Quote Requested' : (order.status === 'pending' ? 'Pending' : order.status);
    const StatusIcon = isQuote ? Send : (order.status === 'pending' ? Clock : CheckCircle);

    return (
        <>
            <div
                className="bg-[#05001a] rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden group hover:border-purple-500/50 transition-all duration-500 relative"
                onMouseEnter={playHum}
            >
                <div className="floor-glow" style={{ '--glow-color': 'rgba(168, 85, 247, 0.4)' }}></div>
                <div className="p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-white/5">
                        <div className="space-y-2 sm:space-y-3 flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <span className="px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5 sm:gap-2">
                                    <StatusIcon size={10} className="sm:hidden" />
                                    <StatusIcon size={12} className="hidden sm:block" />
                                    {statusLabel}
                                </span>
                                <span className="text-gray-600 font-mono text-xs sm:text-sm font-black">#{order.id.split('_')[1]}</span>
                            </div>
                            <p className="text-gray-500 text-xs font-medium">
                                {isQuote
                                    ? 'We\'ll review your designs and get back to you with pricing.'
                                    : `Status: ${order.status}`
                                }
                            </p>
                        </div>

                        <div className="flex flex-row sm:flex-col justify-between sm:justify-end text-sm font-bold text-gray-500 space-x-2 sm:space-x-0 sm:space-y-2 sm:pl-12">
                            <div className="text-left sm:text-right text-xs text-gray-600 uppercase tracking-widest font-black">
                                {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </div>
                            <div className="text-right text-[10px] text-gray-600 uppercase tracking-widest">
                                {order.items?.length || 0} design{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 sm:gap-4 bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 group-hover:bg-purple-50/5 transition-colors">
                                <div
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-lg flex-shrink-0 cursor-zoom-in hover:border-purple-500/40 transition-colors"
                                    onClick={() => { setLightboxImage(item.image); setLightboxName(item.product_name); }}
                                >
                                    <img src={item.image} alt={item.product_name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-white truncate text-xs sm:text-sm">{item.product_name}</div>
                                    <div className="text-[9px] sm:text-[10px] font-black text-purple-400 uppercase tracking-widest">Qty: {item.quantity}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 px-4 sm:px-8 py-3 sm:py-4 border-t border-white/5 flex items-center justify-between group-hover:bg-purple-600 transition-colors duration-500">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Clock size={14} className="text-gray-500 group-hover:text-purple-200 sm:hidden" />
                        <Clock size={16} className="text-gray-500 group-hover:text-purple-200 hidden sm:block" />
                        <span className="text-[9px] sm:text-[10px] font-black text-gray-500 tracking-widest group-hover:text-purple-200 uppercase">
                            {isQuote ? 'Response within 24-48 hours' : (order.status === 'shipped' ? 'In Transit' : 'Processing')}
                        </span>
                    </div>
                    {order.chat_session_id && onViewChat && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onViewChat(order.chat_session_id); }}
                            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-all border border-white/10 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30"
                        >
                            <MessageSquare size={10} className="sm:hidden" />
                            <MessageSquare size={12} className="hidden sm:block" />
                            <span className="hidden sm:inline">View Chat</span>
                            <span className="sm:hidden">Chat</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Image Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 cursor-zoom-out p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10 border border-white/10"
                    >
                        <X size={20} className="sm:hidden" />
                        <X size={24} className="hidden sm:block" />
                    </button>
                    <div className="relative max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={lightboxImage}
                            alt={lightboxName}
                            className="max-w-full max-h-[85vh] object-contain rounded-xl sm:rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)]"
                        />
                        {lightboxName && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 rounded-b-xl sm:rounded-b-2xl">
                                <h3 className="text-white font-black text-base sm:text-xl">{lightboxName}</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default OrderManifest;
