import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, Trash2, Send, Loader2, MessageSquare, Clock, Mail, Printer, X } from 'lucide-react';
import Button from '../components/ui/Button';

const CheckoutPage = ({ cart, removeFromCart, updateQuantity, clearCart, setView, user, onAuthSuccess, chatSessionId }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [lightboxImage, setLightboxImage] = useState(null);
    const [lightboxName, setLightboxName] = useState('');

    const handleSubmitQuote = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target);

        // If not logged in, register first
        let currentUserId = user?.id;

        if (!user) {
            try {
                const regResponse = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.get('email'),
                        password: formData.get('password'),
                        fullName: formData.get('fullName')
                    })
                });

                const regData = await regResponse.json();
                if (!regResponse.ok) throw new Error(regData.error || 'Registration failed');

                onAuthSuccess(regData.user, regData.token);
                currentUserId = regData.user.id;
            } catch (err) {
                console.error('Registration error:', err);
                alert(`Authentication Error: ${err.message}`);
                setIsSubmitting(false);
                return;
            }
        }

        const quoteData = {
            userId: currentUserId,
            customer_name: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            shipping_address: 'Quote Request',
            billing_address: 'Quote Request',
            total: 0,
            creditsUsed: 0,
            notes: notes,
            chatSessionId: chatSessionId || null,
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            }))
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quoteData)
            });

            if (!response.ok) throw new Error('Failed to submit quote request');

            setIsSubmitted(true);
            setTimeout(() => {
                clearCart();
                setIsSubmitted(false);
                setView('home');
            }, 5000);
        } catch (error) {
            console.error('Quote request error:', error);
            alert('Something went wrong submitting your quote request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Empty cart state
    if (cart.length === 0 && !isSubmitted) {
        return (
            <div className="container mx-auto px-4 py-16 sm:py-24 text-center min-h-[80vh] flex flex-col items-center justify-center">
                <div className="bg-white/5 p-6 sm:p-8 rounded-full mb-6 border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <ShoppingCart size={36} className="text-purple-500 sm:hidden" />
                    <ShoppingCart size={48} className="text-purple-500 hidden sm:block" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">No designs yet!</h2>
                <p className="text-gray-500 mb-8 max-w-md font-bold uppercase tracking-widest text-xs sm:text-sm px-4">Design something awesome and request a quote.</p>
                <Button onClick={() => setView('home')} className="px-8 sm:px-10 py-3 sm:py-4">Start Designing</Button>
            </div>
        );
    }

    // Success state
    if (isSubmitted) {
        return (
            <div className="container mx-auto px-4 py-16 sm:py-24 text-center min-h-[80vh] flex flex-col items-center justify-center animate-fadeIn">
                <div className="bg-green-500/10 p-6 sm:p-8 rounded-full mb-6 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                    <CheckCircle size={48} className="text-green-500 sm:hidden" />
                    <CheckCircle size={64} className="text-green-500 hidden sm:block" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 uppercase tracking-tighter">Quote Requested!</h2>
                <p className="text-gray-400 text-base sm:text-lg mb-4 font-bold max-w-lg px-4">
                    Thanks for your interest! Arav will review your designs and get back to you with pricing and details.
                </p>
                <p className="text-gray-500 text-sm mb-8 max-w-md px-4">
                    Check your email for a confirmation. We typically respond within 24-48 hours.
                </p>
                <div className="flex items-center gap-3 text-sm text-purple-400 font-black uppercase tracking-[0.3em]">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                    Redirecting to home...
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-3 sm:mb-4 text-white uppercase tracking-tighter">
                Request a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Quote</span>
            </h2>
            <p className="text-center text-gray-500 mb-8 sm:mb-16 max-w-xl mx-auto text-xs sm:text-sm font-medium px-2">
                You're not placing an order yet. Submit your designs and we'll send you a custom quote with final pricing, print time, and shipping options.
            </p>

            <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 max-w-7xl mx-auto">
                {/* Design Items */}
                <div className="flex-1 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Your Designs ({cart.length})</span>
                    </div>
                    {cart.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl sm:items-center group hover:border-purple-500/30 transition-all">
                            <div
                                className="w-full sm:w-24 h-48 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-gray-900 shadow-xl flex-shrink-0 cursor-zoom-in"
                                onClick={() => { setLightboxImage(item.image); setLightboxName(item.name); }}
                            >
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-lg sm:text-xl text-white tracking-tight truncate">{item.name}</h3>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">{item.category || 'Custom Design'}</p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 bg-gray-950 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl border border-white/5">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-black text-gray-400 hover:text-white transition-all"
                                    >
                                        -
                                    </button>
                                    <span className="font-black text-white w-4 text-center text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-black text-gray-400 hover:text-white transition-all"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2.5 sm:p-3 bg-white/5 rounded-xl text-gray-600 hover:text-rose-500 transition-all hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
                                >
                                    <Trash2 size={18} className="sm:hidden" />
                                    <Trash2 size={20} className="hidden sm:block" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quote Request Form */}
                <div className="lg:w-[500px]">
                    <div className="bg-gray-950/80 backdrop-blur-2xl p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6 sm:space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 flex items-center gap-3 sm:gap-4 uppercase tracking-tighter">
                                <Send size={22} className="text-purple-500 sm:hidden" />
                                <Send size={28} className="text-purple-500 hidden sm:block" />
                                Get Your Quote
                            </h3>
                            <p className="text-gray-500 text-xs font-medium pl-1">
                                Tell us where to send your custom quote. No payment required.
                            </p>

                            <form onSubmit={handleSubmitQuote} className="space-y-5 sm:space-y-6 mt-6 sm:mt-8">
                                {/* Contact Info */}
                                <div className="space-y-3 sm:space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] pl-1">Contact Information</label>
                                    <input name="fullName" defaultValue={user?.fullName || ''} required type="text" placeholder="Full Name" className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600 shadow-inner text-sm sm:text-base" />
                                    <div className={`grid ${!user ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3 sm:gap-4`}>
                                        <input name="email" defaultValue={user?.email || ''} required type="email" placeholder="Email Address" className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600 text-sm sm:text-base" />
                                        {user ? (
                                            <input name="phone" type="tel" placeholder="Phone (optional)" className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600 text-sm sm:text-base" />
                                        ) : null}
                                    </div>
                                    {!user && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <input name="phone" type="tel" placeholder="Phone (optional)" className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600 text-sm sm:text-base" />
                                            <input name="password" required type="password" placeholder="Create Password" className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600 text-sm sm:text-base" />
                                        </div>
                                    )}
                                    {!user && (
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest italic">
                                                An account will be created to track your quotes.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Additional Notes */}
                                <div className="space-y-3 sm:space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] pl-1">Additional Notes (optional)</label>
                                    <textarea
                                        name="notes"
                                        rows="3"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Any special requests? Size preferences, color details, gift wrapping..."
                                        className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600 resize-none text-sm sm:text-base"
                                    />
                                </div>

                                {/* What Happens Next */}
                                <div className="bg-purple-500/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-purple-500/10 space-y-3 sm:space-y-4">
                                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">What happens next?</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Mail size={12} className="text-purple-400" />
                                            </div>
                                            <p className="text-gray-400 text-xs font-medium">We'll email you a detailed quote with exact pricing for each design.</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Clock size={12} className="text-purple-400" />
                                            </div>
                                            <p className="text-gray-400 text-xs font-medium">Expect a response within 24-48 hours with your custom price.</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Printer size={12} className="text-purple-400" />
                                            </div>
                                            <p className="text-gray-400 text-xs font-medium">Once you approve, Arav prints and ships your creations!</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Badge */}
                                <div className="flex items-center gap-3 px-2">
                                    <MessageSquare size={14} className="text-gray-600 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                        No payment required — this is just a quote request
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 sm:py-6 text-base sm:text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_20px_40px_-5px_rgba(79,70,229,0.6)] transition-all duration-300 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin" size={20} /> Submitting...</>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Request Quote
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
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
        </div>
    );
};

export default CheckoutPage;
