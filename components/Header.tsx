
import React from 'react';
import type { User } from '../types';
import { LoadingSpinner } from './icons';

interface HeaderProps {
    isAuthLoading: boolean;
    currentUser: User | null;
    setActiveTab: (tab: string) => void;
    onShowAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAuthLoading, currentUser, setActiveTab, onShowAuth }) => {
    
    const handleButtonClick = () => {
        if (currentUser) {
            setActiveTab('profile');
        } else {
            onShowAuth();
        }
    };

    return (
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-neutral-900/80 to-transparent">
            <h1 className="text-2xl font-celebration text-special-primary">Woon</h1>
            <button
                disabled={isAuthLoading}
                onClick={handleButtonClick}
                className="px-4 py-2 text-sm font-medium rounded-full bg-special-primary/20 text-special-secondary hover:bg-special-primary/30 transition-colors flex items-center justify-center w-20 disabled:opacity-50"
            >
                {isAuthLoading ? (
                    <LoadingSpinner className="h-5 w-5" />
                ) : (
                    <span>
                        {currentUser ? 'Profile' : 'Log In'}
                    </span>
                )}
            </button>
        </header>
    );
};
