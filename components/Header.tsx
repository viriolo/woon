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
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-4 sm:px-6 sm:pt-6">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-surface-light/90 px-4 py-2 text-sm font-semibold text-ink-700 shadow-brand ring-1 ring-white/40">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white font-bold">W</span>
                <div className="hidden sm:block">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Neighborly</p>
                    <p className="text-sm font-semibold text-ink-900">Celebrations</p>
                </div>
            </div>
            <button
                type="button"
                onClick={handleClick}
                disabled={isAuthLoading}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-surface-light/90 px-4 py-2 text-sm font-semibold text-ink-700 shadow-brand ring-1 ring-white/40 transition hover:translate-y-0.5 hover:bg-primary/10 disabled:opacity-60"
            >
                {isAuthLoading ? (
                    <LoadingSpinner className="h-4 w-4" />
                ) : (
                    <span>{currentUser ? "View profile" : "Sign in"}</span>
                )}
            </button>
        </header>
    );
};
