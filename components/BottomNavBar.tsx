import React from "react";
import { HomeIcon, AddCircleIcon, ConnectIcon, ProfileIcon } from "./icons";

interface BottomNavBarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isMapView: boolean;
}

const baseItemClasses = "flex flex-col items-center gap-1 text-xs font-semibold transition-colors";

const getLabel = (id: string) => {
    switch (id) {
        case "today":
            return "Map";
        case "share":
            return "Celebrate";
        case "connect":
            return "Connect";
        case "profile":
            return "Profile";
        default:
            return id;
    }
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setActiveTab, isMapView }) => {
    const navItems = [
        { id: "today", icon: <HomeIcon className="h-6 w-6" /> },
        { id: "connect", icon: <ConnectIcon className="h-6 w-6" /> },
        { id: "profile", icon: <ProfileIcon className="h-6 w-6" /> },
    ];

    return (
        <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 pb-6">
            <div className="pointer-events-auto relative mx-auto flex max-w-md items-end justify-between rounded-t-[1.75rem] bg-background-light/95 px-6 pb-4 pt-8 shadow-brand backdrop-blur">
                <button
                    type="button"
                    onClick={() => setActiveTab("share")}
                    className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-brand transition-transform hover:scale-105"
                >
                    <AddCircleIcon className="h-8 w-8" />
                </button>
                <div className="flex w-full items-end justify-around pt-1">
                    {navItems.map(({ id, icon }) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                type="button"
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`${baseItemClasses} ${
                                    isActive ? "text-primary" : "text-ink-500 hover:text-primary"
                                } ${id === "today" && isMapView ? "text-primary" : ""}`}
                            >
                                <span className="flex h-8 w-8 items-center justify-center">{icon}</span>
                                <span>{getLabel(id)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};
