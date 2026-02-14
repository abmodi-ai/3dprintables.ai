import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, Trash2, CreditCard } from 'lucide-react';
import Button from '../components/ui/Button';

const CheckoutPage = ({ cart, removeFromCart, updateQuantity, clearCart, setView, user, onAuthSuccess }) => {
    const [isCheckedOut, setIsCheckedOut] = useState(false);

    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Status-based Protocol Logic
    const isElite = user?.orderCount >= 50;
    const discountRate = isElite ? 0.15 : 0.00;
    const shipping = isElite ? 0.00 : 5.99;

    const protocolDiscount = subtotal * discountRate;
    const initialTotal = (subtotal - protocolDiscount) + shipping;
    const finalTotal = Math.max(0, initialTotal);

    const handleCheckout = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target);

        // 1. If not logged in, register first
        let currentUserId = user?.id;

        if (!user) {
            try {
                const regResponse = await fetch('http://localhost:3001/api/auth/register', {
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

                // Sign user in
                onAuthSuccess(regData.user, regData.token);
                currentUserId = regData.user.id;
            } catch (err) {
                console.error('Registration error during checkout:', err);
                alert(`Authentication Error: ${err.message}`);
                setIsSubmitting(false);
                return;
            }
        }

        const orderData = {
            userId: currentUserId,
            customer_name: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            shipping_address: `${formData.get('shipStreet')}, ${formData.get('shipCity')}, ${formData.get('shipZip')}`,
            billing_address: billingSameAsShipping
                ? `${formData.get('shipStreet')}, ${formData.get('shipCity')}, ${formData.get('shipZip')}`
                : `${formData.get('billStreet')}, ${formData.get('billCity')}, ${formData.get('billZip')}`,
            total: finalTotal,
            creditsUsed: creditsUsed,
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            }))
        };

        try {
            const response = await fetch('http://localhost:3001/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) throw new Error('Failed to save order');

            setIsCheckedOut(true);
            setTimeout(() => {
                clearCart();
                setIsCheckedOut(false);
                setView('home');
            }, 4000);
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong with your order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cart.length === 0 && !isCheckedOut) {
        return (
            <div className="container mx-auto px-4 py-24 text-center min-h-[80vh] flex flex-col items-center justify-center">
                <div className="bg-white/5 p-8 rounded-full mb-6 border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <ShoppingCart size={48} className="text-purple-500" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Your manifest is empty!</h2>
                <p className="text-gray-500 mb-8 max-w-md font-bold uppercase tracking-widest text-sm text-sm">Time to assign new targets for the 3D fabrication units.</p>
                <Button onClick={() => setView('ai-lab')} className="px-10 py-4">Initialize Design Sequence</Button>
            </div>
        );
    }

    if (isCheckedOut) {
        return (
            <div className="container mx-auto px-4 py-24 text-center min-h-[80vh] flex flex-col items-center justify-center animate-fadeIn">
                <div className="bg-green-500/10 p-8 rounded-full mb-6 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                    <CheckCircle size={64} className="text-green-500" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Transmission Confirmed!</h2>
                <p className="text-gray-400 text-lg mb-8 font-bold">Your blueprints have been uploaded to the fabrication cluster.</p>
                <div className="flex items-center gap-3 text-sm text-purple-400 font-black uppercase tracking-[0.3em]">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                    Redirecting to Neuro-Base...
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-black text-center mb-16 text-white uppercase tracking-tighter">Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Manifest</span></h2>

            <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
                {/* Cart Items */}
                <div className="flex-1 space-y-6">
                    {cart.map(item => (
                        <div key={item.id} className="flex gap-6 p-6 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl items-center group hover:border-purple-500/30 transition-all">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-gray-900 shadow-xl flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-xl text-white tracking-tight">{item.name}</h3>
                                <p className="text-purple-400 font-black tracking-widest text-sm uppercase mt-1">PRICE: TBD</p>
                            </div>
                            <div className="flex items-center gap-4 bg-gray-950 px-4 py-2 rounded-2xl border border-white/5">
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
                                className="p-3 bg-white/5 rounded-xl text-gray-600 hover:text-rose-500 transition-all hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Checkout Section */}
                <div className="lg:w-[500px]">
                    <div className="bg-gray-950/80 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                        <div>
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter">
                                <CreditCard size={32} className="text-purple-500" />
                                Checkout
                            </h3>

                            <form onSubmit={handleCheckout} className="space-y-8">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] pl-1">Identity Tokens</label>
                                    <input name="fullName" defaultValue={user?.fullName || ''} required type="text" placeholder="Full Name" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600 shadow-inner" />
                                    <div className={`grid ${!user ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                                        <input name="email" defaultValue={user?.email || ''} required type="email" placeholder="Email Channel" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                        {user ? (
                                            <input name="phone" required type="tel" placeholder="Phone Number" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                        ) : null}
                                    </div>
                                    {!user && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <input name="phone" required type="tel" placeholder="Phone Number" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                            <input name="password" required type="password" placeholder="Key Phrase (Password)" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                        </div>
                                    )}
                                    {!user && (
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest italic">
                                                Neuro-Link Access (Account) will be provisioned.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Shipping Address */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] pl-1">Target Coordinates</label>
                                    <input name="shipStreet" required type="text" placeholder="Physical Sector (Street)" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="shipCity" required type="text" placeholder="Zone (City)" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                        <input name="shipZip" required type="text" placeholder="Grid Code (Zip)" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                    </div>
                                </div>

                                {/* Billing Toggle */}
                                <div className="flex items-center gap-3 px-1">
                                    <input
                                        type="checkbox"
                                        id="billing-toggle"
                                        checked={billingSameAsShipping}
                                        onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                                        className="w-5 h-5 accent-purple-600 rounded bg-gray-900 border-white/10"
                                    />
                                    <label htmlFor="billing-toggle" className="text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors">Unified Billing/Targeting</label>
                                </div>

                                {!billingSameAsShipping && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] pl-1">Billing Data</label>
                                        <input name="billStreet" required type="text" placeholder="Billing Sector" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input name="billCity" required type="text" placeholder="Zone" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                            <input name="billZip" required type="text" placeholder="Grid Code" className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-600" />
                                        </div>
                                    </div>
                                )}



                                <div className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-4 shadow-inner">
                                    <div className="flex justify-between text-xs font-black text-gray-500 uppercase tracking-widest">
                                        <span>Material Flux</span>
                                        <span className="text-white">TBD</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-black text-gray-500 uppercase tracking-widest">
                                        <span>Logistics Fee</span>
                                        <span className="text-white">TBD</span>
                                    </div>

                                    <div className="h-px bg-white/5"></div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-2xl font-black text-white tracking-tighter">
                                            <span>SUB TOTAL</span>
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 shadow-purple-500/50">TBD</span>
                                        </div>
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-right animate-pulse">
                                            We will tell you the price later
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full py-10 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 shadow-[0_0_50px_rgba(168,85,247,0.15)] group/lock">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Price Protocol Active</span>
                                    </div>
                                    <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-widest animate-pulse">
                                        We will tell you the price later
                                    </h3>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Awaiting final manufacturing quote</p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
