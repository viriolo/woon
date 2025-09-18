
import React from 'react';
import { CELEBRATIONS } from '../constants';
import { BellIcon, StarIcon, ShieldCheckIcon, CogIcon, ChevronRightIcon } from './icons';

interface ProfileViewProps {
    isLoggedIn: boolean;
    onLoginToggle: () => void;
}

const LoggedOutView: React.FC<{ onLoginToggle: () => void }> = ({ onLoginToggle }) => (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-4 animate-fade-in">
        <h2 className="text-3xl font-display text-special-primary mb-2">Your Profile</h2>
        <p className="text-neutral-300 max-w-md mb-6">
            Sign in to save your favorite celebrations, share your own creations, and customize your experience.
        </p>
        <button
            onClick={onLoginToggle}
            className="px-6 py-3 text-base font-bold rounded-full bg-special-primary text-neutral-900 hover:opacity-90 transition-opacity"
        >
            Log In or Sign Up
        </button>
    </div>
);


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h3 className="text-sm font-bold uppercase text-neutral-500 tracking-wider px-4 mb-2">{title}</h3>
        {children}
    </section>
);

const SettingsItem: React.FC<{ icon: React.ReactNode, label: string }> = ({ icon, label }) => (
    <button className="w-full flex items-center justify-between p-4 text-left bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg">
        <div className="flex items-center gap-4">
            <div className="text-special-secondary">{icon}</div>
            <span className="font-medium">{label}</span>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-neutral-500" />
    </button>
);


const LoggedInView: React.FC<{ onLoginToggle: () => void }> = ({ onLoginToggle }) => {
    const userCelebrations = CELEBRATIONS.slice(0, 3);

    return (
        <div className="h-full overflow-y-auto pb-24 animate-fade-in">
            <div className="pt-20 p-4 flex items-center gap-4">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" className="w-16 h-16 rounded-full border-2 border-special-primary" />
                <div>
                    <h2 className="text-2xl font-bold font-display">Alex Doe</h2>
                    <p className="text-neutral-400">Celebration Streak: 14 days 🔥</p>
                </div>
            </div>

            <div className="px-4 mb-6">
                <Section title="My Celebrations">
                    <div className="flex gap-4 overflow-x-auto -mx-4 px-4 pb-2">
                         {userCelebrations.map(c => (
                            <div key={c.id} className="flex-shrink-0 w-40">
                                <img src={c.imageUrl} alt={c.title} className="w-full h-24 object-cover rounded-lg mb-1" />
                                <p className="text-sm font-medium truncate">{c.title}</p>
                                <p className="text-xs text-special-secondary">{c.likes} Likes</p>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>
            
            <Section title="Preferences">
                <div className="px-4">
                    <div className="rounded-lg overflow-hidden border border-neutral-700/50">
                        <SettingsItem icon={<BellIcon className="w-6 h-6" />} label="Notifications" />
                        <SettingsItem icon={<StarIcon className="w-6 h-6" />} label="Celebration Interests" />
                        <SettingsItem icon={<ShieldCheckIcon className="w-6 h-6" />} label="Privacy & Community" />
                    </div>
                </div>
            </Section>
            
            <Section title="Account">
                <div className="px-4">
                    <div className="rounded-lg overflow-hidden border border-neutral-700/50">
                        <SettingsItem icon={<CogIcon className="w-6 h-6" />} label="Subscription: Free Tier" />
                         <button onClick={onLoginToggle} className="w-full p-4 text-left text-red-400 bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors font-medium">
                            Log Out
                        </button>
                    </div>
                </div>
            </Section>

        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ isLoggedIn, onLoginToggle }) => {
    return isLoggedIn ? <LoggedInView onLoginToggle={onLoginToggle}/> : <LoggedOutView onLoginToggle={onLoginToggle}/>;
};