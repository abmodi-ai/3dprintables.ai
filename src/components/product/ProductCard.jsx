import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import { playClink, playHum, playGrab } from '../../utils/sounds';

const ProductCard = ({ product, addToCart }) => {
    const handleMouseEnter = () => {
        playHum();
    };

    const handleAddToCart = () => {
        playClink();
        addToCart(product);
    };

    const handleGrab = () => {
        playGrab();
    };

    return (
        <div
            className="group bg-[#0a0a1a]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-6 transition-all duration-500 hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.15)] hover:-translate-y-2 flex flex-col h-full relative overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseDown={handleGrab}
        >
            {/* Floor Glow Effect */}
            <div className="floor-glow" style={{ '--glow-color': 'rgba(168, 85, 247, 0.4)' }}></div>

            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

            <div className="relative aspect-square mb-6 overflow-hidden rounded-[2rem] bg-gray-900 border border-white/5 shadow-2xl">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-all duration-1000 opacity-0"
                    loading="lazy"
                    onLoad={(e) => {
                        e.target.classList.remove('opacity-0');
                        e.target.classList.add('opacity-100');
                    }}
                    onError={(e) => {
                        e.target.src = 'https://placehold.co/400x400/030014/94a3b8?text=Toy+Image';
                        e.target.classList.remove('opacity-0');
                        e.target.classList.add('opacity-100');
                    }}
                />
                <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black text-amber-400 flex items-center gap-1.5 shadow-2xl border border-white/10">
                    <Star size={14} fill="currentColor" strokeWidth={0} /> {product.rating || '5.0'}
                </div>
                <div className="absolute bottom-4 left-4">
                    <span className="bg-purple-600/20 backdrop-blur-md text-purple-400 border border-purple-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl">
                        {product.category}
                    </span>
                </div>
            </div>

            <div className="flex-1 space-y-3 px-1">
                <h3 className="text-2xl font-black text-white leading-tight group-hover:text-purple-400 transition-colors tracking-tight">{product.name}</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed line-clamp-2">{product.description}</p>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5 px-1">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2 italic">Unit Price</span>
                    <span className="text-3xl font-black text-white leading-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">${product.price}</span>
                </div>
                <button
                    onClick={handleAddToCart}
                    className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-2xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-purple-500/40 transform active:scale-90 border border-purple-400/20"
                    aria-label="Add to cart"
                >
                    <ShoppingCart size={22} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
