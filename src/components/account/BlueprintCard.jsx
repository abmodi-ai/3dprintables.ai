import React from 'react';
import { playHum, playGrab, playClink } from '../../utils/sounds';

const BlueprintCard = ({ print, addToCart, setView }) => {
    return (
        <div
            className="bg-[#05001a] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden group hover:border-purple-500/50 transition-all duration-500 relative"
            onMouseEnter={playHum}
            onMouseDown={playGrab}
        >
            <div className="floor-glow" style={{ '--glow-color': 'rgba(59, 130, 246, 0.4)' }}></div>
            <div className="aspect-[16/10] overflow-hidden relative">
                <img src={print.image} alt={print.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                <div className="absolute bottom-6 left-6">
                    <h4 className="text-2xl font-black text-white">{print.name}</h4>
                    <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em]">{print.category}</p>
                </div>
                <div className="absolute top-6 right-6 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-purple-400 border border-white/10 font-black shadow-2xl">
                    ${print.price}
                </div>
            </div>
            <div className="p-6 flex justify-between items-center">
                <p className="text-gray-500 font-bold text-xs italic truncate mr-4">"{print.image_prompt?.slice(0, 50)}..."</p>
                <button
                    onClick={() => {
                        playClink();
                        addToCart({
                            id: `prod_${Date.now()}`, // Temporary ID for cart
                            name: print.name,
                            price: print.price,
                            image: print.image,
                            category: print.category
                        });
                        setView('cart');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-lg flex-shrink-0 uppercase tracking-widest"
                >
                    Order Print
                </button>
            </div>
        </div>
    );
};

export default BlueprintCard;
