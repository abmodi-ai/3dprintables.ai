import React from 'react';
import { Loader2, Package } from 'lucide-react';

const OrderList = ({ orders, isLoadingOrders }) => {
    return (
        <div className="space-y-10 animate-fadeIn max-w-4xl mx-auto">
            {isLoadingOrders ? (
                <div className="flex flex-col items-center py-32 text-gray-700">
                    <Loader2 className="animate-spin mb-6 text-purple-500" size={64} />
                    <p className="font-black uppercase tracking-[0.4em] text-xs">Decrypting Manifest Vault...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white/5 p-32 rounded-[4rem] border border-dashed border-white/5 text-center shadow-inner">
                    <Package className="mx-auto text-gray-950 mb-6" size={80} />
                    <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Manifest Vault Primary Zero</h3>
                </div>
            ) : (
                orders.map(order => (
                    <div key={order.id} className="bg-gray-950/50 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden group hover:border-purple-500/30 transition-all duration-700">
                        <div className="p-10">
                            <div className="flex flex-col md:flex-row justify-between gap-10 mb-10 pb-10 border-b border-white/5">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-purple-500/20">Operational Record</span>
                                        <span className="text-gray-600 font-mono text-sm font-bold">CID_{order.id.split('_')[1]}</span>
                                    </div>
                                    <h3 className="text-4xl font-black text-white tracking-tighter">{order.customer_name}</h3>
                                    <div className="flex flex-wrap gap-6 text-xs font-black uppercase tracking-widest text-gray-500">
                                        <span className="flex items-center gap-2"><span className="text-purple-500">CHANNEL:</span> {order.email}</span>
                                        <span className="flex items-center gap-2"><span className="text-purple-500">COMM:</span> {order.phone}</span>
                                    </div>
                                </div>
                                <div className="text-right md:min-w-[200px]">
                                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2">Transaction Value</div>
                                    <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">${order.total.toFixed(2)}</div>
                                    <div className="text-[10px] font-black text-gray-700 mt-3 uppercase tracking-widest">{new Date(order.created_at).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                        <div className="w-10 h-0.5 bg-purple-500/30"></div> Logistics Status
                                    </h4>
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="space-y-2 group/coord">
                                            <div className="text-[10px] font-black text-gray-600 group-hover/coord:text-gray-400 transition-colors">PRIMARY COORD. (SHIPPING)</div>
                                            <p className="text-sm font-bold text-gray-400 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">{order.shipping_address}</p>
                                        </div>
                                        <div className="space-y-2 group/coord">
                                            <div className="text-[10px] font-black text-gray-600 group-hover/coord:text-gray-400 transition-colors">FINANCIAL SECTOR (BILLING)</div>
                                            <p className="text-sm font-bold text-gray-400 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">{order.billing_address}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                        <div className="w-10 h-0.5 bg-pink-500/30"></div> Cargo Manifest
                                    </h4>
                                    <div className="space-y-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-6 bg-white/5 p-5 rounded-3xl border border-white/5 group-hover:bg-purple-500/5 transition-all duration-700">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 bg-gray-900">
                                                    <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-black text-white text-lg tracking-tight truncate">{item.product_name}</div>
                                                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">
                                                        Load: {item.quantity} units <span className="mx-2 text-gray-700">|</span> Value: ${item.price}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 px-10 py-6 border-t border-white/5 flex justify-between items-center group-hover:bg-purple-600 transition-colors duration-700">
                            <div className="text-[10px] font-black text-gray-600 tracking-[0.4em] group-hover:text-purple-200 uppercase flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
                                PHASE: Active Fabrication
                            </div>
                            <button className="text-[10px] font-black text-purple-400 bg-gray-950 px-6 py-3 rounded-2xl border border-white/5 shadow-2xl hover:scale-110 hover:bg-white hover:text-purple-600 transition-all uppercase tracking-widest">Mark Dispatched</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default OrderList;
