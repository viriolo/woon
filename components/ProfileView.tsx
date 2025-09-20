import React, { useRef } from "react";
import type { User, NotificationPreferences, Celebration, Achievement } from "../types";
import { BellIcon, StarIcon, ShieldCheckIcon, CogIcon, ChevronRightIcon, SparklesIcon } from "./icons";

interface ProfileViewProps {
    currentUser: User | null;
    onLogout: () => void;
    onShowAuth: () => void;
    onPreferencesChange: (newPrefs: Partial<NotificationPreferences>) => void;
    onAvatarChange: (base64Image: string) => void;
    celebrations: Celebration[];
    onShowMission: () => void;
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

const SettingsItem: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-neutral-100/50 transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
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
        className={`${enabled ? "bg-special-primary" : "bg-neutral-300"}
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-special-primary focus:ring-offset-2 focus:ring-offset-white`}
    >
        <span
            aria-hidden="true"
            className={`${enabled ? "translate-x-5" : "translate-x-0"}
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const SettingsToggleItem: React.FC<{ label: string; description: string; isEnabled: boolean; onToggle: (isEnabled: boolean) => void }> = ({ label, description, isEnabled, onToggle }) => (
    <div className="w-full flex items-center justify-between p-4 text-left bg-white first:rounded-t-lg last:rounded-b-lg">
        <div className="flex flex-col">
            <span className="font-medium text-neutral-900">{label}</span>
            <span className="text-sm text-neutral-500">{description}</span>
        </div>
        <ToggleSwitch enabled={isEnabled} onChange={onToggle} />
    </div>
);

const ExperienceBar: React.FC<{ experiencePoints: number; level: number }> = ({ experiencePoints, level }) => {
    const levelThreshold = level * 200;
    const previousThreshold = (level - 1) * 200;
    const progress = Math.min(100, ((experiencePoints - previousThreshold) / (levelThreshold - previousThreshold || 1)) * 100);

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Level {level}</span>
                <span className="text-xs text-neutral-400">{experiencePoints} XP</span>
            </div>
            <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-special-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-neutral-400 mt-2">{Math.max(0, levelThreshold - experiencePoints)} XP to next level</p>
        </div>
    );
};

const AchievementList: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => {
    if (!achievements.length) {
        return <p className="text-sm text-neutral-500 px-4 py-3 bg-white rounded-lg shadow-sm">Earn achievements by celebrating and hosting events.</p>;
    }

    return (
        <div className="grid grid-cols-1 gap-3 px-4">
            {achievements.map(achievement => (
                <div key={achievement.id} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200/60">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-neutral-800">{achievement.name}</h4>
                        <SparklesIcon className="w-5 h-5 text-special-secondary" />
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">{achievement.description}</p>
                </div>
            ))}
        </div>
    );
};

const LoggedInView: React.FC<{ user: User; onLogout: () => void; onPreferencesChange: (newPrefs: Partial<NotificationPreferences>) => void; onAvatarChange: (base64Image: string) => void; celebrations: Celebration[]; onShowMission: () => void; }> = ({ user, onLogout, onPreferencesChange, onAvatarChange, celebrations, onShowMission }) => {
    const userCelebrations = celebrations.filter(c => c.authorId === user.id);
    const savedCelebrations = celebrations.filter(c => user.savedCelebrationIds.includes(c.id) && c.authorId !== user.id);
    const avatarUrl = user.avatarUrl || `https://i.pravatar.cc/150?u=${user.email}`;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === "string") {
                    onAvatarChange(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="h-full overflow-y-auto pb-24 animate-fade-in bg-neutral-100">
            <div className="pt-20 p-4 flex items-center gap-4 bg-neutral-50">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
                <button onClick={handleAvatarClick} className="relative group flex-shrink-0" aria-label="Change avatar">
                    <img src={avatarUrl} alt="User Avatar" className="w-16 h-16 rounded-full border-2 border-special-primary object-cover group-hover:opacity-75 transition-opacity" />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-white text-xs font-bold text-center">Change</span>
                    </div>
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold font-display">{user.name}</h2>
                    <p className="text-neutral-500">Celebration streak: <span className="font-semibold text-special-primary">{user.streakDays} days</span></p>
                </div>
            </div>

            <div className="px-4 mt-4 space-y-4">
                <ExperienceBar experiencePoints={user.experiencePoints} level={user.level} />
            </div>

            <Section title="My Celebrations">
                <div className="px-4">
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
                        <div className="text-center text-neutral-500 py-4 bg-white rounded-lg shadow-sm">You haven't posted any celebrations yet.</div>
                    )}
                </div>
            </Section>

            <Section title="Saved for Later">
                <div className="px-4">
                    {savedCelebrations.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {savedCelebrations.map(c => (
                                <div key={c.id} className="bg-white rounded-lg shadow-sm p-3">
                                    <img src={c.imageUrl} alt={c.title} className="w-full h-24 object-cover rounded-md mb-2" />
                                    <h4 className="text-sm font-semibold text-neutral-800 truncate">{c.title}</h4>
                                    <p className="text-xs text-neutral-500">by {c.author}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-neutral-500 py-4 bg-white rounded-lg shadow-sm">Tap the bookmark icon on a celebration to save it here.</div>
                    )}
                </div>
            </Section>

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

            <Section title="Achievements">
                <AchievementList achievements={user.achievements} />
            </Section>

            <Section title="About">
                <div className="px-4">
                    <div className="rounded-lg overflow-hidden border border-neutral-200 shadow-sm">
                        <SettingsItem icon={<SparklesIcon className="w-6 h-6" />} label="Our Mission" onClick={onShowMission} />
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

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onLogout, onShowAuth, onPreferencesChange, onAvatarChange, celebrations, onShowMission }) => {
    return currentUser ? (
        <LoggedInView
            user={currentUser}
            onLogout={onLogout}
            onPreferencesChange={onPreferencesChange}
            onAvatarChange={onAvatarChange}
            celebrations={celebrations}
            onShowMission={onShowMission}
        />
    ) : (
        <LoggedOutView onShowAuth={onShowAuth} />
    );
};
