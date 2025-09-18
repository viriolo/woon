
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { DiscoveryView } from './components/DiscoveryView';
import { CreateView } from './components/CreateView';
import { ConnectView } from './components/ConnectView';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import type { SpecialDay, Celebration, User } from './types';
import { TODAY_SPECIAL_DAY, TOMORROW_SPECIAL_DAY, CELEBRATIONS } from './constants';
import { authService } from './services/authService';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isAuthViewVisible, setIsAuthViewVisible] = useState(false);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        setIsAuthViewVisible(false);
    };

    const handleLogout = () => {
        setIsAuthLoading(true);
        setTimeout(() => { // Simulate async logout
            authService.logOut();
            setCurrentUser(null);
            setActiveTab('today'); // Go to a safe tab after logging out
            setIsAuthLoading(false);
        }, 500);
    };

    const handleSetTab = (tab: string) => {
        if (tab === 'share' && !currentUser) {
            setIsAuthViewVisible(true); // Protect the share route
        } else {
            setActiveTab(tab);
        }
    };

    const todaySpecialDay: SpecialDay = TODAY_SPECIAL_DAY;
    const tomorrowSpecialDay: SpecialDay = TOMORROW_SPECIAL_DAY;
    const celebrations: Celebration[] = CELEBRATIONS;

    const renderContent = () => {
        switch (activeTab) {
            case 'today':
                return <DiscoveryView specialDay={todaySpecialDay} tomorrowSpecialDay={tomorrowSpecialDay} celebrations={celebrations} />;
            case 'share':
                // This view is protected by handleSetTab, so currentUser will exist here.
                return currentUser ? <CreateView specialDay={todaySpecialDay} /> : null;
            case 'connect':
                return <ConnectView />;
            case 'profile':
                return <ProfileView currentUser={currentUser} onLogout={handleLogout} onShowAuth={() => setIsAuthViewVisible(true)} />;
            default:
                return <DiscoveryView specialDay={todaySpecialDay} tomorrowSpecialDay={tomorrowSpecialDay} celebrations={celebrations} />;
        }
    };
    
    return (
        <div className="h-screen w-screen flex flex-col bg-neutral-900 bg-gradient-to-br from-neutral-900 to-neutral-800">
            <Header 
                isAuthLoading={isAuthLoading}
                currentUser={currentUser} 
                setActiveTab={setActiveTab} 
                onShowAuth={() => setIsAuthViewVisible(true)}
            />
            <main className="flex-grow overflow-hidden relative">
                {renderContent()}
            </main>
            <BottomNavBar activeTab={activeTab} setActiveTab={handleSetTab} />
            {isAuthViewVisible && (
                <AuthView
                    onClose={() => setIsAuthViewVisible(false)}
                    onLoginSuccess={handleLoginSuccess}
                    onSetAuthLoading={setIsAuthLoading}
                />
            )}
        </div>
    );
};

export default App;
