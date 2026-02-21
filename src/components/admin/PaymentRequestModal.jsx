import React, { useState, useRef, useEffect } from 'react';
import { X, CreditCard, Upload, Loader2, DollarSign, Ruler, Package, Clock, ImagePlus } from 'lucide-react';

const PaymentRequestModal = ({ isOpen, onClose, orderId, order, token, onSuccess }) => {
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [dimensions, setDimensions] = useState('');
    const [deliveryDays, setDeliveryDays] = useState('');
    const [dimensionImage, setDimensionImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Pre-fill product name from order items
    useEffect(() => {
        if (isOpen && order?.items?.length > 0) {
            setProductName(order.items.map(i => i.product_name).join(', '));
        }
    }, [isOpen, order]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setProductName('');
            setPrice('');
            setDimensions('');
            setDeliveryDays('');
            setDimensionImage(null);
            setImagePreview(null);
            setError('');
        }
    }, [isOpen]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB');
            return;
        }
        setDimensionImage(file);
        setImagePreview(URL.createObjectURL(file));
        setError('');
    };

    const clearImage = () => {
        setDimensionImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!productName.trim()) return setError('Product name is required');
        if (!price || parseFloat(price) <= 0) return setError('Valid price is required');

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('product_name', productName.trim());
            formData.append('price', price);
            if (dimensions.trim()) formData.append('dimensions', dimensions.trim());
            if (deliveryDays) formData.append('delivery_days', deliveryDays);
            if (dimensionImage) formData.append('dimension_image', dimensionImage);

            const res = await fetch(`/api/orders/${orderId}/payment-request`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send payment request');

            onSuccess(orderId, parseFloat(price));
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#030014]/90 backdrop-blur-md animate-fadeIn" onClick={onClose}></div>

            {/* Modal */}
            <div className="bg-gray-900 rounded-[3rem] p-8 sm:p-10 max-w-lg w-full relative z-10 shadow-2xl animate-scaleIn border border-purple-500/20 max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                        <CreditCard size={28} className="text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Request Payment</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">
                        Order #{orderId?.split('_')[1]}
                    </p>
                    {order?.customer_name && (
                        <p className="text-sm text-gray-400 font-bold mt-1">{order.customer_name} • {order.email}</p>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-3 rounded-2xl text-sm font-bold mb-6 text-center animate-shake">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Product Name */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">
                            Product Name *
                        </label>
                        <div className="relative">
                            <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="Custom 3D Print..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors font-bold"
                            />
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">
                            Price (USD) *
                        </label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                min="0.01"
                                step="0.01"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors font-bold"
                            />
                        </div>
                    </div>

                    {/* Dimensions */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">
                            Dimensions (mm)
                        </label>
                        <div className="relative">
                            <Ruler size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={dimensions}
                                onChange={(e) => setDimensions(e.target.value)}
                                placeholder="e.g. 100mm x 50mm x 30mm"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors font-bold"
                            />
                        </div>
                    </div>

                    {/* Delivery Estimate */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">
                            Delivery Estimate (days)
                        </label>
                        <div className="relative">
                            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="number"
                                value={deliveryDays}
                                onChange={(e) => setDeliveryDays(e.target.value)}
                                placeholder="e.g. 7"
                                min="1"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors font-bold"
                            />
                        </div>
                    </div>

                    {/* Dimension Image Upload */}
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">
                            3D Dimension Image
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        {imagePreview ? (
                            <div className="relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Dimension preview"
                                    className="max-h-40 rounded-2xl border border-purple-500/30"
                                />
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-white rounded-full p-1 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
                            >
                                <ImagePlus size={28} className="text-gray-500" />
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Upload Image</span>
                                <span className="text-[10px] text-gray-600">PNG, JPG or WEBP (Max 5MB)</span>
                            </button>
                        )}
                    </div>

                    {/* Price Summary */}
                    {price && parseFloat(price) > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-center">
                            <p className="text-[10px] font-black text-amber-400/60 uppercase tracking-widest mb-1">Payment Request Amount</p>
                            <p className="text-3xl font-black text-amber-400">${parseFloat(price).toFixed(2)}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <CreditCard size={18} />
                                Send Payment Request
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentRequestModal;
