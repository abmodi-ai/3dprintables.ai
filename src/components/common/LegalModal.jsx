import React from 'react';
import { X } from 'lucide-react';

const privacyContent = (
    <>
        <h3 className="text-lg font-black text-white mb-3">Information We Collect</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">When you create an account, we collect your name, email address, and password (stored securely with encryption). When you place an order, we collect your shipping and billing address.</p>

        <h3 className="text-lg font-black text-white mb-3">How We Use Your Information</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">We use your information to process orders, deliver products, communicate about your orders, and improve our services. We do not sell or share your personal data with third parties for marketing purposes.</p>

        <h3 className="text-lg font-black text-white mb-3">AI-Generated Designs</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">Designs you create using our AI tools are stored on your account. Design prompts are sent to third-party AI services for generation. We do not use your designs for purposes other than fulfilling your orders.</p>

        <h3 className="text-lg font-black text-white mb-3">Data Security</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">We implement industry-standard security measures to protect your personal information, including encrypted passwords and secure data transmission.</p>

        <h3 className="text-lg font-black text-white mb-3">Contact Us</h3>
        <p className="text-gray-400 leading-relaxed">If you have questions about this Privacy Policy, please contact us at hello@3dprintables.ai.</p>
    </>
);

const termsContent = (
    <>
        <h3 className="text-lg font-black text-white mb-3">Acceptance of Terms</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">By using 3DPrintables.ai, you agree to these Terms of Service. If you do not agree, please do not use our services.</p>

        <h3 className="text-lg font-black text-white mb-3">Products & Orders</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">All products are custom 3D-printed to order. Due to the custom nature of our products, production times may vary. We strive to deliver all orders within the estimated timeframe provided at checkout.</p>

        <h3 className="text-lg font-black text-white mb-3">AI Design Tools</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">Our AI design tools generate product previews based on your descriptions. Final printed products may vary slightly from AI-generated previews. You retain ownership of your custom designs.</p>

        <h3 className="text-lg font-black text-white mb-3">Pricing & Payment</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">Prices are displayed in USD and include the cost of materials, printing, and labor. Shipping costs are calculated at checkout. All payments are processed securely.</p>

        <h3 className="text-lg font-black text-white mb-3">Returns & Refunds</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">Since all products are custom-made, we offer refunds only for defective items or items that do not match the approved design. Please contact support within 14 days of receiving your order.</p>

        <h3 className="text-lg font-black text-white mb-3">Contact Us</h3>
        <p className="text-gray-400 leading-relaxed">For questions about these Terms, contact us at hello@3dprintables.ai.</p>
    </>
);

const LegalModal = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    const isPrivacy = type === 'privacy';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#030014]/90 backdrop-blur-md animate-fadeIn" onClick={onClose}></div>
            <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full max-h-[80vh] relative z-10 shadow-2xl animate-scaleIn border border-white/10 flex flex-col">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} className="text-gray-400" />
                </button>

                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                    {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
                </h2>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-8">
                    Last updated: February 2026
                </p>

                <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {isPrivacy ? privacyContent : termsContent}
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
