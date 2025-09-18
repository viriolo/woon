
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { DiscoveryView } from './components/DiscoveryView';
import { CreateView } from './components/CreateView';
import { ConnectView } from './components/ConnectView';
import { ProfileView } from './components/ProfileView';
import type { SpecialDay, Celebration } from './types';
import { TODAY_SPECIAL_DAY, TOMORROW_SPECIAL_DAY, CELEBRATIONS } from './constants';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const todaySpecialDay: SpecialDay = TODAY_SPECIAL_DAY;
    const tomorrowSpecialDay: SpecialDay = TOMORROW_SPECIAL_DAY;
    const celebrations: Celebration[] = CELEBRATIONS;

    const handleLoginToggle = useCallback(() => {
        setIsLoggedIn(prev => !prev);
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'today':
                return <DiscoveryView specialDay={todaySpecialDay} tomorrowSpecialDay={tomorrowSpecialDay} celebrations={celebrations} />;
            case 'share':
                return isLoggedIn ? <CreateView specialDay={todaySpecialDay} /> : <LoginPrompt />;
            case 'connect':
                return <ConnectView />;
            case 'profile':
                return <ProfileView isLoggedIn={isLoggedIn} onLoginToggle={handleLoginToggle} />;
            default:
                return <DiscoveryView specialDay={todaySpecialDay} tomorrowSpecialDay={tomorrowSpecialDay} celebrations={celebrations} />;
        }
    };
    
    return (
        <div className="h-screen w-screen flex flex-col bg-neutral-900 bg-gradient-to-br from-neutral-900 to-neutral-800">
            <Header isLoggedIn={isLoggedIn} setActiveTab={setActiveTab} />
            <main className="flex-grow overflow-hidden relative">
                {renderContent()}
            </main>
            <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
};


const LoginPrompt: React.FC = () => (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-4 animate-fade-in">
        <h2 className="text-2xl font-display text-special-primary mb-2">Join the Celebration!</h2>
        <p className="text-neutral-300 max-w-md">
            You need to be logged in to share your own celebration displays. Log in to inspire your neighbors and be part of the community.
        </p>
    </div>
);


export default App;