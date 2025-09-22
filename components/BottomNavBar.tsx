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
        { id: "today", icon: <HomeIcon className="w-6 h-6" />, label: "Discover" },
        { id: "connect", icon: <ConnectIcon className="w-6 h-6" />, label: "Events" },
        { id: "profile", icon: <ProfileIcon className="w-6 h-6" />, label: "Profile" },
    ];

    return (
        <nav className="fixed inset-x-0 bottom-0 z-30 p-4">
            <div className="surface-elevated mx-auto max-w-sm rounded-full px-2 py-2 relative">
                {/* Floating Create Button */}
                <button
                    type="button"
                    onClick={() => setActiveTab("share")}
                    className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform ring-4 ring-white"
                >
                    <AddCircleIcon className="w-7 h-7" />
                </button>

                {/* Navigation Items */}
                <div className="flex items-center justify-around pt-4">
                    {navItems.map(({ id, icon, label }) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveTab(id)}
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                                    isActive
                                        ? "text-orange-500 bg-orange-50"
                                        : "text-gray-500 hover:text-orange-500 hover:bg-orange-50"
                                }`}
                            >
                                {icon}
                                <span className="text-xs font-medium">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};
