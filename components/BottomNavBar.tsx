
import React from 'react';
import { HomeIcon, AddCircleIcon, ConnectIcon, ProfileIcon } from './icons';

interface BottomNavBarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

interface NavItemProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    isCenter?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick, isCenter = false }) => {
    const baseClasses = "flex flex-col items-center justify-center transition-all duration-300 ease-in-out";
    const activeClasses = "text-special-primary";
    const inactiveClasses = "text-neutral-500 hover:text-special-secondary";

    if (isCenter) {
        return (
            <button
                onClick={onClick}
                className={`${baseClasses} -mt-8 h-16 w-16 rounded-full bg-gradient-to-br from-special-primary to-purple-500 shadow-lg shadow-special-primary/20 ring-4 ring-neutral-50`}
            >
                <div className={`h-8 w-8 text-white`}>
                    {icon}
                </div>
            </button>
        );
    }
    
    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} w-16`}>
            <div className="h-6 w-6">{icon}</div>
            <span className={`text-xs mt-1 font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
        </button>
    );
};


export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'today', label: 'Today', icon: <HomeIcon /> },
        { id: 'share', label: 'Share', icon: <AddCircleIcon />, isCenter: true },
        { id: 'connect', label: 'Connect', icon: <ConnectIcon /> },
        { id: 'profile', label: 'Profile', icon: <ProfileIcon /> }
    ];

    return (
        <nav className="absolute bottom-0 left-0 right-0 z-20">
            <div className="mx-auto max-w-md h-20 bg-neutral-100/70 backdrop-blur-lg border-t border-neutral-200/50 rounded-t-2xl flex justify-around items-center">
                 {navItems.map((item, index) => (
                    <NavItem
                        key={item.id}
                        label={item.label}
                        icon={item.icon}
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        isCenter={item.isCenter}
                    />
                 ))}
            </div>
        </nav>
    );
};