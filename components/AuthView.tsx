import React, { useState } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';
import { XCircleIcon, LoadingSpinner } from './icons';

interface AuthViewProps {
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
    onSetAuthLoading: (isLoading: boolean) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onClose, onLoginSuccess, onSetAuthLoading }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="relative w-full max-w-sm m-4 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl p-8 animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors" aria-label="Close authentication">
                    <XCircleIcon className="w-8 h-8" />
                </button>
                
                <h2 className="text-3xl font-display font-bold text-center text-special-primary mb-2">
                    {mode === 'login' ? 'Welcome Back!' : 'Join Woon'}
                </h2>
                <p className="text-neutral-400 text-center mb-6">
                    {mode === 'login' ? "Log in to continue your celebration." : "Create an account to start sharing."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            required
                            disabled={isLoading}
                            className="w-full p-3 bg-neutral-700 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                        />
                    )}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        required
                        disabled={isLoading}
                        className="w-full p-3 bg-neutral-700 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        disabled={isLoading}
                        className="w-full p-3 bg-neutral-700 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 flex justify-center items-center gap-2 bg-special-primary text-neutral-900 font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
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