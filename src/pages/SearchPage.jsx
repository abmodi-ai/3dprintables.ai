import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';

const SearchPage = ({ products, addToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, products]);

    return (
        <div className="container mx-auto px-4 py-24 min-h-[80vh]">
            <div className="max-w-3xl mx-auto mb-20 text-center space-y-6">
                <div className="relative group mt-8">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-[2.5rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500"></div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Scan the archives (concepts, types, colors)..."
                            className="w-full text-xl p-7 pl-16 rounded-[2rem] border border-white/10 bg-[#030014]/50 backdrop-blur-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all shadow-2xl text-white font-black placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-purple-500" size={28} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10 animate-in fade-in duration-1000 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                    <div className="w-24 h-24 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/5 relative z-10">
                        <AlertTriangle size={48} className="text-gray-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 relative z-10">Neural Map Depleted</h3>
                    <p className="text-gray-400 font-bold max-w-xs mx-auto relative z-10">No matches found for "{searchTerm}". The system suggests initializing a new design sequence.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ProductCard product={product} addToCart={addToCart} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchPage;
