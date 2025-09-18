
import React from 'react';

interface HeaderProps {
    isLoggedIn: boolean;
    onLoginToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLoginToggle }) => {
    return (
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-neutral-900/80 to-transparent">
            <h1 className="text-2xl font-celebration text-special-primary">Woon</h1>
            <button
                onClick={onLoginToggle}
                className="px-4 py-2 text-sm font-medium rounded-full bg-special-primary/20 text-special-secondary hover:bg-special-primary/30 transition-colors"
            >
                {isLoggedIn ? 'Profile' : 'Log In'}
            </button>
        </header>
    );
};
