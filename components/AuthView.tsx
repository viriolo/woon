import React, { useState } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';
import { XCircleIcon, LoadingSpinner, GoogleIcon, FacebookIcon } from './icons';

interface AuthViewProps {
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
    onSetAuthLoading: (isLoading: boolean) => void;
}

const SocialButton: React.FC<{
    provider: 'google' | 'facebook';
    onClick: () => void;
    disabled: boolean;
}> = ({ provider, onClick, disabled }) => {
    const isGoogle = provider === 'google';
    const styles = {
        google: 'bg-white text-neutral-700 hover:bg-neutral-200/50 border-neutral-300',
        facebook: 'bg-[#1877F2] text-white hover:bg-[#166eeb] border-transparent',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-full py-3 px-4 flex justify-center items-center gap-3 border rounded-lg font-medium transition disabled:opacity-50 ${styles[provider]}`}
        >
            {isGoogle ? <GoogleIcon className="w-5 h-5" /> : <FacebookIcon className="w-6 h-6" />}
            <span>Continue with {isGoogle ? 'Google' : 'Facebook'}</span>
        </button>
    );
};

export const AuthView: React.FC<AuthViewProps> = ({ onClose, onLoginSuccess, onSetAuthLoading }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSocialLogin = async (provider: 'google' | 'facebook') => {
        setError('');
        setIsLoading(true);
        onSetAuthLoading(true);
        try {
            const user = await authService.socialLogIn(provider);
            onLoginSuccess(user);
        } catch (err: any) {
            setError(err.message || 'An error occurred during social login.');
        } finally {
            setIsLoading(false);
            onSetAuthLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        onSetAuthLoading(true);

        try {
            let user: User;
            if (mode === 'signup') {
                user = await authService.signUp(name, email, password);
            } else {
                user = await authService.logIn(email, password);
            }
            onLoginSuccess(user);
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
            onSetAuthLoading(false);
        }
    };

    const toggleMode = () => {
        setError('');
        setMode(prev => (prev === 'login' ? 'signup' : 'login'));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="relative w-full max-w-sm m-4 bg-neutral-100 border border-neutral-200 rounded-2xl shadow-2xl p-8 animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 transition-colors" aria-label="Close authentication">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                
                <h2 className="text-3xl font-display font-bold text-center text-special-primary mb-2">
                    {mode === 'login' ? 'Welcome Back!' : 'Join Woon'}
                </h2>
                <p className="text-neutral-500 text-center mb-6">
                    {mode === 'login' ? "Log in to continue your celebration." : "Create an account to start sharing."}
                </p>

                <div className="space-y-3">
                    <SocialButton provider="google" onClick={() => handleSocialLogin('google')} disabled={isLoading} />
                    <SocialButton provider="facebook" onClick={() => handleSocialLogin('facebook')} disabled={isLoading} />
                </div>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-neutral-300"></div>
                    <span className="flex-shrink mx-4 text-xs text-neutral-500 uppercase">OR</span>
                    <div className="flex-grow border-t border-neutral-300"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            required
                            disabled={isLoading}
                            className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                        />
                    )}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        required
                        disabled={isLoading}
                        className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        disabled={isLoading}
                        className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 flex justify-center items-center gap-2 bg-special-primary text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner className="h-5 w-5" />
                                <span>Processing...</span>
                            </>
                        ) : (mode === 'login' ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button onClick={toggleMode} className="text-sm text-special-secondary hover:underline">
                        {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                    </button>
                </div>
            </div>
        </div>
    );
};