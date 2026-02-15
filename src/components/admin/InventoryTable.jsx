import React from 'react';
import { Trash2 } from 'lucide-react';

const InventoryTable = ({ products, setItemToDelete }) => {
    return (
        <div className="bg-gray-950/50 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-gray-500 border-b border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em]">Product</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-center">Price</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-center">Category</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-purple-600/5 transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900 flex-shrink-0">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                onError={(e) => { e.target.src = 'https://placehold.co/100x100/111/444?text=Toy'; }}
                                            />
                                        </div>
                                        <div>
                                            <div className="font-black text-white text-xl tracking-tight group-hover:text-purple-400 transition-colors uppercase">{product.name}</div>
                                            <div className="text-xs text-gray-600 font-bold hidden sm:block truncate max-w-[300px] mt-1">{product.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="font-black text-2xl text-white tracking-tighter">${product.price}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="bg-purple-600/10 text-purple-400 border border-purple-500/20 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all group-hover:bg-purple-600 group-hover:text-white">
                                        {product.category}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button
                                        onClick={() => setItemToDelete(product)}
                                        className="p-4 text-gray-700 hover:text-rose-500 bg-white/5 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                                        title="Delete Product"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-8 py-32 text-center">
                                    <div className="text-gray-800 text-3xl font-black uppercase tracking-tighter">No Products</div>
                                    <p className="text-gray-600 font-black text-xs uppercase tracking-widest mt-2 italic">Add products to see them here</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;
