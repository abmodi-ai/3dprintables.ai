import React from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

const PaymentCancelPage = ({ setView }) => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');

    const retryPayment = () => {
        if (orderId) {
            window.location.href = `/api/payment/${orderId}/checkout`;
        }
    };

    return (
        <div className="container mx-auto px-4 py-24 text-center min-h-[80vh] flex flex-col items-center justify-center animate-fadeIn">
            <div className="bg-amber-500/10 p-8 rounded-full mb-8 border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                <AlertCircle size={64} className="text-amber-500" />
            </div>

            <h2 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">
                Payment Cancelled
            </h2>

            <p className="text-gray-400 text-lg mb-2 font-bold max-w-lg">
                Your payment was not completed. No charges have been made.
            </p>
            <p className="text-gray-500 text-sm mb-8 max-w-md">
                You can try again using the link in your email, or contact us if you need help.
            </p>

            {orderId && (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 mb-8 inline-block">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Order ID: </span>
                    <span className="text-sm font-black text-purple-400 font-mono">{orderId}</span>
                </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
                {orderId && (
                    <button
                        onClick={retryPayment}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-3"
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </button>
                )}
                <button
                    onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }}
                    className="bg-white/10 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 hover:bg-white/20 transition-all flex items-center gap-3"
                >
                    <Home size={16} />
                    Go Home
                </button>
            </div>
        </div>
    );
};

export default PaymentCancelPage;
