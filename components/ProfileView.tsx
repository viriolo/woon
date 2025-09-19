
import React, { useRef } from 'react';
import type { User, NotificationPreferences, Celebration } from '../types';
import { BellIcon, StarIcon, ShieldCheckIcon, CogIcon, ChevronRightIcon } from './icons';

interface ProfileViewProps {
    currentUser: User | null;
    onLogout: () => void;
    onShowAuth: () => void;
    onPreferencesChange: (newPrefs: Partial<NotificationPreferences>) => void;
    onAvatarChange: (base64Image: string) => void;
    celebrations: Celebration[];
}

const LoggedOutView: React.FC<{ onShowAuth: () => void }> = ({ onShowAuth }) => (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-4 animate-fade-in">
        <h2 className="text-3xl font-display text-special-primary mb-2">Your Profile</h2>
        <p className="text-neutral-700 max-w-md mb-6">
            Sign in to save your favorite celebrations, share your own creations, and customize your experience.
        </p>
        <button
            onClick={onShowAuth}
            className="px-6 py-3 text-base font-bold rounded-full bg-special-primary text-white hover:opacity-90 transition-opacity"
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
    <button className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-neutral-100/50 transition-colors first:rounded-t-lg last:rounded-b-lg">
        <div className="flex items-center gap-4">
            <div className="text-special-secondary">{icon}</div>
            <span className="font-medium">{label}</span>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-neutral-500" />
    </button>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`${enabled ? 'bg-special-primary' : 'bg-neutral-300'}
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-special-primary focus:ring-offset-2 focus:ring-offset-white`}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-5' : 'translate-x-0'}
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);


const SettingsToggleItem: React.FC<{ label: string, description: string, isEnabled: boolean, onToggle: (isEnabled: boolean) => void }> = ({ label, description, isEnabled, onToggle }) => (
    <div className="w-full flex items-center justify-between p-4 text-left bg-white first:rounded-t-lg last:rounded-b-lg">
        <div className="flex flex-col">
            <span className="font-medium text-neutral-900">{label}</span>
            <span className="text-sm text-neutral-500">{description}</span>
        </div>
        <ToggleSwitch enabled={isEnabled} onChange={onToggle} />
    </div>
);


const LoggedInView: React.FC<{ user: User; onLogout: () => void; onPreferencesChange: (newPrefs: Partial<NotificationPreferences>) => void; onAvatarChange: (base64Image: string) => void; celebrations: Celebration[]; }> = ({ user, onLogout, onPreferencesChange, onAvatarChange, celebrations }) => {
    const userCelebrations = celebrations.filter(c => c.authorId === user.id);
    const avatarUrl = user.avatarUrl || `https://i.pravatar.cc/150?u=${user.email}`;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    onAvatarChange(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="h-full overflow-y-auto pb-24 animate-fade-in bg-neutral-100">
            <div className="pt-20 p-4 flex items-center gap-4 bg-neutral-50">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
                <button onClick={handleAvatarClick} className="relative group flex-shrink-0">
                    <img src={avatarUrl} alt="User Avatar" className="w-16 h-16 rounded-full border-2 border-special-primary object-cover group-hover:opacity-75 transition-opacity" />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-white text-xs font-bold text-center">Change</span>
                    </div>
                </button>
                <div>
                    <h2 className="text-2xl font-bold font-display">{user.name}</h2>
                    <p className="text-neutral-500">Celebration Streak: 14 days 🔥</p>
                </div>
            </div>

            <div className="px-4 py-6 bg-neutral-50">
                <Section title="My Celebrations">
                    {userCelebrations.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto -mx-4 px-4 pb-2">
                            {userCelebrations.map(c => (
                                <div key={c.id} className="flex-shrink-0 w-40">
                                    <img src={c.imageUrl} alt={c.title} className="w-full h-24 object-cover rounded-lg mb-1 shadow-sm" />
                                    <p className="text-sm font-medium truncate">{c.title}</p>
                                    <p className="text-xs text-special-secondary">{c.likes} Likes</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-neutral-500 py-4">You haven't posted any celebrations yet.</div>
                    )}
                </Section>
            </div>
            
            <Section title="Preferences">
                <div className="px-4">
                    <div className="rounded-lg overflow-hidden border border-neutral-200 shadow-sm">
                        <SettingsToggleItem
                            label="Daily Special Day Alerts"
                            description="Get notified about today's celebration."
                            isEnabled={user.notificationPreferences.dailySpecialDay}
                            onToggle={(isEnabled) => onPreferencesChange({ dailySpecialDay: isEnabled })}
                        />
                         <div className="border-t border-neutral-200"></div>
                        <SettingsToggleItem
                            label="Community Activity Updates"
                            description="Notifications from neighbors & events."
                            isEnabled={user.notificationPreferences.communityActivity}
                            onToggle={(isEnabled) => onPreferencesChange({ communityActivity: isEnabled })}
                        />
                        <div className="border-t border-neutral-200"></div>
                        <SettingsItem icon={<StarIcon className="w-6 h-6" />} label="Celebration Interests" />
                        <div className="border-t border-neutral-200"></div>
                        <SettingsItem icon={<ShieldCheckIcon className="w-6 h-6" />} label="Privacy & Community" />
                    </div>
                </div>
            </Section>
            
            <Section title="Account">
                <div className="px-4">
                    <div className="rounded-lg overflow-hidden border border-neutral-200 shadow-sm">
                        <SettingsItem icon={<CogIcon className="w-6 h-6" />} label="Subscription: Free Tier" />
                         <button onClick={onLogout} className="w-full p-4 text-left text-red-500 bg-white hover:bg-neutral-100/50 transition-colors font-medium">
                            Log Out
                        </button>
                    </div>
                </div>
            </Section>

        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onLogout, onShowAuth, onPreferencesChange, onAvatarChange, celebrations }) => {
    return currentUser ? <LoggedInView user={currentUser} onLogout={onLogout} onPreferencesChange={onPreferencesChange} onAvatarChange={onAvatarChange} celebrations={celebrations} /> : <LoggedOutView onShowAuth={onShowAuth} />;
};