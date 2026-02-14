import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const response = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            onAuthSuccess(data.user, data.token);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-purple-900/40 backdrop-blur-md animate-fadeIn" onClick={onClose}></div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-md w-full relative z-10 shadow-2xl animate-scaleIn border-4 border-purple-100">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-purple-50 rounded-full transition-colors">
                    <X size={20} className="text-gray-400" />
                </button>

                <div className="text-center mb-10">
                    <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="text-purple-600" size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                        {isLogin ? 'Welcome Back, Designer' : 'Join the Laboratory'}
                    </h2>
                    <p className="text-gray-500 font-bold mt-2">
                        {isLogin ? 'Enter your credentials to access your lab' : 'Create an account to save your 3D creations'}
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                            <input
                                required
                                type="text"
                                placeholder="Full Name"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-300 focus:bg-white outline-none transition-all font-bold text-gray-700"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                        <input
                            required
                            type="email"
                            placeholder="Email Address"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-300 focus:bg-white outline-none transition-all font-bold text-gray-700"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                        <input
                            required
                            type="password"
                            placeholder="Security Key (Password)"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-300 focus:bg-white outline-none transition-all font-bold text-gray-700"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full py-5 text-lg shadow-xl mt-4">
                        {isLoading ? (
                            <Loader2 className="animate-spin mx-auto" />
                        ) : (
                            isLogin ? 'Authorize Access' : 'Create Lab ID'
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 font-bold">
                        {isLogin ? "Don't have a Lab ID?" : "Already a member?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-purple-600 hover:underline decoration-2 underline-offset-4"
                        >
                            {isLogin ? 'Apply for Entry' : 'Log In Here'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
