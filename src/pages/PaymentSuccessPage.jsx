import React from 'react';
import { CheckCircle, Home, Package } from 'lucide-react';

const PaymentSuccessPage = ({ setView }) => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');

    return (
        <div className="container mx-auto px-4 py-24 text-center min-h-[80vh] flex flex-col items-center justify-center animate-fadeIn">
            <div className="bg-green-500/10 p-8 rounded-full mb-8 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                <CheckCircle size={64} className="text-green-500" />
            </div>

            <h2 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">
                Payment Successful!
            </h2>

            <p className="text-gray-400 text-lg mb-2 font-bold max-w-lg">
                Thank you for your payment. Your custom 3D print order is now being processed.
            </p>
            <p className="text-gray-500 text-sm mb-8 max-w-md">
                You'll receive a confirmation email shortly with details about your order.
            </p>

            {orderId && (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 mb-8 inline-block">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Order ID: </span>
                    <span className="text-sm font-black text-purple-400 font-mono">{orderId}</span>
                </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
                <button
                    onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center gap-3"
                >
                    <Home size={16} />
                    Go to Homepage
                </button>
                <button
                    onClick={() => { setView('account'); window.history.pushState({}, '', '/'); }}
                    className="bg-white/10 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 hover:bg-white/20 transition-all flex items-center gap-3"
                >
                    <Package size={16} />
                    View My Orders
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
