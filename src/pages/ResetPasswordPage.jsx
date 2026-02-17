import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPasswordPage = ({ token, setView, openAuth }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password. Please try again.');
            }

            setSuccess(true);
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

    // No token provided — show an error state
    if (!token) {
        return (
            <div className="container mx-auto px-4 py-32 text-center">
                <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <AlertCircle className="text-red-400" size={32} />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Invalid Reset Link</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    This password reset link is missing or invalid. Please request a new one.
                </p>
                <button
                    onClick={() => setView('home')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                >
                    Go to Homepage
                </button>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="container mx-auto px-4 py-32 text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <CheckCircle className="text-green-400" size={32} />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Password Reset!</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Your password has been updated successfully. You can now sign in with your new password.
                </p>
                <button
                    onClick={() => { setView('home'); setTimeout(() => openAuth(), 100); }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                >
                    Sign In
                </button>
            </div>
        );
    }

    // Reset form
    return (
        <div className="container mx-auto px-4 py-20 max-w-md">
            <div className="text-center mb-10">
                <div className="bg-purple-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                    <Lock className="text-purple-400" size={32} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Set New Password</h2>
                <p className="text-gray-500 font-bold mt-2">Enter your new password below</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-sm font-bold">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="New Password"
                            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-500"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm New Password"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-purple-500/50 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder-gray-500"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Reset Password'}
                </button>
            </form>
        </div>
    );
};

export default ResetPasswordPage;
