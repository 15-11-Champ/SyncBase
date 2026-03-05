'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';

const Logo = () => (
    <svg width="280" height="60" viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Abstract Sync Arcs */}
        <path d="M10 30C10 16.7452 18.0589 6 28 6V54C18.0589 54 10 43.2548 10 30Z" fill="#0052CC" />
        <path d="M22 30C22 16.7452 30.0589 6 40 6V54C30.0589 54 22 43.2548 22 30Z" fill="#0052CC" />
        <path d="M34 30C34 16.7452 42.0589 6 52 6V54C42.0589 54 34 43.2548 34 30Z" fill="#0052CC" />
        {/* Text */}
        <text x="65" y="45" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="42" fill="#1A1A1A">Sync</text>
        <text x="175" y="45" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="42" fill="#0052CC">Base</text>
    </svg>
);

export default function SignupPage() {
    const router = useRouter();
    const { signUp } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { success: signupSuccess, error: signupError } = await signUp(email, password, name);

            if (signupSuccess) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(signupError || 'An error occurred during sign up');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during sign up');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdfd] p-4 text-center">
                <div className="mb-10">
                    <Logo />
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 max-w-sm w-full space-y-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Account Created!</h2>
                    <p className="text-gray-500">
                        Welcome to SyncBase. We've linked you to our demo organization. Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdfd] p-4">
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
                <Logo />
            </div>

            <div className="w-full max-w-sm">
                <form
                    onSubmit={handleSignup}
                    className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 w-full space-y-6"
                >
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                        <p className="text-gray-400 text-sm mt-1">Join SyncBase today</p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0052CC] text-white p-4 rounded-2xl font-bold text-sm hover:bg-[#0041a3] shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-gray-400 text-xs">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#0052CC] font-bold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </form>

                <p className="text-center text-gray-400 text-[10px] mt-8 uppercase tracking-[0.2em]">
                    Powered by SyncBase Enterprise
                </p>
            </div>
        </div>
    );
}
