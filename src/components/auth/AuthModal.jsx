import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });

    if (!isOpen) return null;

    const validateForm = () => {
        const errors = {};

        if (!isLogin && !formData.fullName.trim()) {
            errors.fullName = 'Full name is required.';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email address is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address.';
        }

        if (!formData.password) {
            errors.password = 'Password is required.';
        } else if (!isLogin && formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setIsLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const response = await fetch(`${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed. Please try again.');
            }

            onAuthSuccess(data.user, data.token);
            onClose();
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                setError('Unable to connect to the server. Please try again later.');
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (fieldErrors[field]) {
            setFieldErrors({ ...fieldErrors, [field]: '' });
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
                        {isLogin ? 'Welcome Back' : 'Create Your Account'}
                    </h2>
                    <p className="text-gray-500 font-bold mt-2">
                        {isLogin ? 'Sign in to your account' : 'Create an account to save your 3D designs'}
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {!isLogin && (
                        <div>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 ${fieldErrors.fullName ? 'border-rose-300 bg-rose-50/50' : 'border-gray-100'} focus:border-purple-300 focus:bg-white outline-none transition-all font-bold text-gray-700`}
                                    value={formData.fullName}
                                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                />
                            </div>
                            {fieldErrors.fullName && <p className="text-rose-500 text-xs font-bold mt-1.5 ml-4">{fieldErrors.fullName}</p>}
                        </div>
                    )}

                    <div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 ${fieldErrors.email ? 'border-rose-300 bg-rose-50/50' : 'border-gray-100'} focus:border-purple-300 focus:bg-white outline-none transition-all font-bold text-gray-700`}
                                value={formData.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                            />
                        </div>
                        {fieldErrors.email && <p className="text-rose-500 text-xs font-bold mt-1.5 ml-4">{fieldErrors.email}</p>}
                    </div>

                    <div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                className={`w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 border-2 ${fieldErrors.password ? 'border-rose-300 bg-rose-50/50' : 'border-gray-100'} focus:border-purple-300 focus:bg-white outline-none transition-all font-bold text-gray-700`}
                                value={formData.password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="text-rose-500 text-xs font-bold mt-1.5 ml-4">{fieldErrors.password}</p>}
                    </div>

                    {isLogin && (
                        <div className="text-right">
                            <button
                                type="button"
                                className="text-sm text-purple-500 hover:text-purple-700 font-bold hover:underline decoration-2 underline-offset-4 transition-colors"
                                onClick={() => {
                                    setError('');
                                    setFieldErrors({});
                                    alert('Please contact support@3dprintables.ai to reset your password.');
                                }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full py-5 text-lg shadow-xl mt-4">
                        {isLoading ? (
                            <Loader2 className="animate-spin mx-auto" />
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 font-bold">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); setFieldErrors({}); }}
                            className="ml-2 text-purple-600 hover:underline decoration-2 underline-offset-4"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
