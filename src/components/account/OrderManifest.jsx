import React from 'react';
import { MapPin, Truck } from 'lucide-react';
import PrintingProgress from './PrintingProgress';
import { playHum } from '../../utils/sounds';

const OrderManifest = ({ order }) => {
    return (
        <div
            className="bg-[#05001a] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden group hover:border-purple-500/50 transition-all duration-500 relative"
            onMouseEnter={playHum}
        >
            <div className="floor-glow" style={{ '--glow-color': 'rgba(168, 85, 247, 0.4)' }}></div>
            <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-8 border-b border-white/5">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-green-500/10 text-green-400 border border-green-500/20'
                                }`}>
                                {order.status === 'pending' ? 'Printing' : order.status}
                            </span>
                            <span className="text-gray-600 font-mono text-sm font-black">#{order.id.split('_')[1]}</span>
                        </div>

                        {/* Live Progress Bar */}
                        <PrintingProgress createdAt={order.created_at} status={order.status} />
                    </div>

                    <div className="flex flex-col justify-end text-sm font-bold text-gray-500 space-y-2 md:pl-12">
                        <div className="text-3xl font-black text-white text-right shadow-[0_0_15px_rgba(255,255,255,0.1)]">${order.total.toFixed(2)}</div>
                        <div className="flex items-center gap-2 justify-end">
                            <MapPin size={16} className="text-purple-500" />
                            <span className="text-gray-400">{order.shipping_address.split(',')[0]}</span>
                        </div>
                        <div className="text-right text-xs text-gray-600 uppercase tracking-widest font-black">{new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-purple-50/5 transition-colors">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shadow-lg flex-shrink-0">
                                <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-black text-white truncate text-sm">{item.product_name}</div>
                                <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Quantity: {item.quantity}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 px-8 py-4 border-t border-white/5 flex items-center group-hover:bg-purple-600 transition-colors duration-500">
                <div className="flex items-center gap-2">
                    <Truck size={16} className="text-gray-500 group-hover:text-purple-200" />
                    <span className="text-[10px] font-black text-gray-500 tracking-widest group-hover:text-purple-200 uppercase">
                        {order.status === 'shipped' ? 'In Transit to Site' : 'Est. Delivery: 2-3 Days'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OrderManifest;
