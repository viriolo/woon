import React from "react";
import type { User } from "../types";
import { LoadingSpinner } from "./icons";

interface HeaderProps {
    isAuthLoading: boolean;
    currentUser: User | null;
    setActiveTab: (tab: string) => void;
    onShowAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAuthLoading, currentUser, setActiveTab, onShowAuth }) => {
    const handleClick = () => {
        if (currentUser) {
            setActiveTab("profile");
        } else {
            onShowAuth();
        }
    };

    return (
        <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-6">
            <div className="surface-elevated px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">W</span>
                </div>
                <div className="hidden sm:block">
                    <div className="text-label text-muted">Today's celebration</div>
                    <div className="text-title">Woon</div>
                </div>
            </div>
            <button
                type="button"
                onClick={handleClick}
                disabled={isAuthLoading}
                className={`btn ${currentUser ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            >
                {isAuthLoading ? (
                    <LoadingSpinner className="w-4 h-4" />
                ) : (
                    <span>{currentUser ? "Profile" : "Sign in"}</span>
                )}
            </button>
        </header>
    );
};
