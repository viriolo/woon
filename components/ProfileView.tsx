import React, { useRef, useState } from "react";
import type { User, NotificationPreferences, Celebration, Achievement } from "../types";
import {
    SparklesIcon,
    ChevronRightIcon,
    CameraIcon,
    StarIcon,
    ShieldCheckIcon,
    CogIcon,
    ArrowLeftIcon,
} from "./icons";

interface ProfileViewProps {
    currentUser: User | null;
    onLogout: () => void;
    onShowAuth: () => void;
    onPreferencesChange: (newPrefs: Partial<NotificationPreferences>) => void;
    onAvatarChange: (base64Image: string) => void;
    celebrations: Celebration[];
    onShowMission: () => void;
    onNavigate?: (tab: string) => void;
}

const SectionCard: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, action, children }) => (
    <section className="surface-card surface-card--tight px-6 py-6 space-y-5">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-heading text-lg">{title}</h2>
                {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
            </div>
            {action}
        </header>
        {children}
    </section>
);

const ToggleRow: React.FC<{ label: string; description: string; enabled: boolean; onToggle: (value: boolean) => void }> = ({ label, description, enabled, onToggle }) => (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/80 px-5 py-4">
        <div>
            <p className="text-sm font-semibold text-ink-900">{label}</p>
            <p className="text-xs text-ink-500">{description}</p>
        </div>
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => onToggle(!enabled)}
            className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-primary" : "bg-ink-200"}`}
        >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-5" : "left-0.5"}`} />
        </button>
    </div>
);

const AchievementsList: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => (
    <div className="grid gap-4 sm:grid-cols-2">
        {achievements.length ? (
            achievements.map(achievement => (
                <div key={achievement.id} className="flex items-start gap-3 rounded-2xl bg-white/80 px-5 py-4">
                    <StarIcon className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm font-semibold text-ink-900">{achievement.name}</p>
                        <p className="text-xs text-ink-500">{achievement.description}</p>
                        <p className="mt-1 text-xs text-ink-400">Earned {achievement.earnedAt}</p>
                    </div>
                </div>
            ))
        ) : (
            <div className="rounded-2xl bg-white/80 px-5 py-5 text-sm text-ink-500">Earn achievements by sharing celebrations.</div>
        )}
    </div>
);

const MediaRail: React.FC<{ celebrations: Celebration[]; emptyCopy: string }> = ({ celebrations, emptyCopy }) => (
    celebrations.length ? (
        <div className="scroll-snap-x flex gap-4 overflow-x-auto pb-2">
            {celebrations.map(item => (
                <div key={item.id} className="min-w-[9.5rem] space-y-3">
                    <div className="surface-card surface-card--tight overflow-hidden p-0">
                        <img src={item.imageUrl} alt={item.title} className="h-36 w-full object-cover" />
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="font-semibold text-ink-900 overflow-hidden text-ellipsis">{item.title}</p>
                        <p className="text-xs text-ink-500">{item.likes} likes • {item.commentCount} comments</p>
                    </div>
                </div>
            ))}
        </div>
    ) : (
        <div className="rounded-2xl bg-white/80 px-5 py-5 text-sm text-ink-500">{emptyCopy}</div>
    )
);

const LoggedOutView: React.FC<{ onShowAuth: () => void }> = ({ onShowAuth }) => (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-6">
        <div className="surface-card max-w-md w-full px-8 py-12 space-y-6 text-center">
            <div className="space-y-2">
                <h2 className="text-heading text-3xl text-ink-900">Your Profile</h2>
                <p className="text-body text-ink-500">Sign in to save celebrations, share creations, and connect with neighbors.</p>
            </div>
            <button type="button" onClick={onShowAuth} className="pill-button pill-accent w-full justify-center">
                Sign In or Create Account
            </button>
        </div>
    </div>
);

const LoggedInView: React.FC<{
    user: User;
    celebrations: Celebration[];
    onLogout: () => void;
    onPreferencesChange: (prefs: Partial<NotificationPreferences>) => void;
    onAvatarChange: (base64Image: string) => void;
    onShowMission: () => void;
    onNavigate?: (tab: string) => void;
}> = ({ user, celebrations, onLogout, onPreferencesChange, onAvatarChange, onShowMission, onNavigate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'shared' | 'saved' | 'achievements'>('shared');

    const userCelebrations = celebrations.filter(c => c.authorId === user.id);
    const savedCelebrations = celebrations.filter(c => user.savedCelebrationIds.includes(c.id));

    const stats = [
        { label: "Celebrations", value: userCelebrations.length },
        { label: "Connections", value: user.followingUserIds.length },
        { label: "Saved", value: savedCelebrations.length },
    ];

    const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            onAvatarChange(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-surface">
            {/* Clean Header */}
            <header className="surface-elevated px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-heading text-xl text-ink-900">Profile</h1>
                    <button type="button" onClick={onLogout} className="pill-button pill-secondary text-sm">
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="px-6 py-8">
                {/* Centered Profile Info */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-4">
                        <img
                            src={user.avatarUrl ?? "https://i.pravatar.cc/150?img=5"}
                            alt={user.name}
                            className="h-32 w-32 rounded-full object-cover shadow-brand mx-auto"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-white shadow-lg flex items-center justify-center"
                        >
                            <CameraIcon className="h-5 w-5" />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </div>
                    <h2 className="text-heading text-2xl text-ink-900 mb-2">{user.name}</h2>
                    <p className="text-body text-ink-500 mb-6">@{user.handle ?? user.email.split("@")[0]}</p>

                    {/* Three Column Stats */}
                    <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mb-8">
                        {stats.map(stat => (
                            <div key={stat.label} className="text-center">
                                <div className="text-heading text-2xl text-ink-900 mb-1">{stat.value}</div>
                                <div className="text-caption text-ink-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-ink-100 mb-6">
                    <nav className="flex gap-6 justify-center">
                        {[
                            { id: 'shared', label: 'Shared', count: userCelebrations.length },
                            { id: 'saved', label: 'Saved', count: savedCelebrations.length },
                            { id: 'achievements', label: 'Achievements', count: user.achievements.length },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-3 px-1 border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary font-medium'
                                        : 'border-transparent text-ink-500 hover:text-ink-700'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'shared' && (
                    <div>
                        <MediaRail celebrations={userCelebrations} emptyCopy="You haven't posted any celebrations yet. Share one today!" />
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div>
                        <MediaRail celebrations={savedCelebrations} emptyCopy="Tap the bookmark icon on a celebration to save it here." />
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div>
                        <AchievementsList achievements={user.achievements} />
                    </div>
                )}

                {/* Settings Section */}
                <div className="mt-12 space-y-6">
                    <SectionCard title="Notifications & Preferences">
                        <div className="flex flex-col gap-3">
                            <ToggleRow
                                label="Daily special day alerts"
                                description="Stay in the loop about today's spotlight celebration."
                                enabled={user.notificationPreferences.dailySpecialDay}
                                onToggle={(value) => onPreferencesChange({ dailySpecialDay: value })}
                            />
                            <ToggleRow
                                label="Community activity updates"
                                description="Highlights from neighbors you follow and events you join."
                                enabled={user.notificationPreferences.communityActivity}
                                onToggle={(value) => onPreferencesChange({ communityActivity: value })}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="About Woon"
                        subtitle="Learn more about how we celebrate together."
                        action={(
                            <button type="button" onClick={onShowMission} className="pill-button pill-accent">
                                <SparklesIcon className="h-5 w-5" /> View Mission
                            </button>
                        )}
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <button type="button" className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                                Celebration Interests
                                <ChevronRightIcon className="h-5 w-5 text-ink-400" />
                            </button>
                            <button type="button" className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                                Privacy & Community Settings
                                <ShieldCheckIcon className="h-5 w-5 text-ink-400" />
                            </button>
                            <button type="button" className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                                Manage Subscription
                                <CogIcon className="h-5 w-5 text-ink-400" />
                            </button>
                        </div>
                    </SectionCard>

                    {/* CMS Management Section - Only show if onNavigate is provided */}
                    {onNavigate && (
                        <SectionCard
                            title="Content Management"
                            subtitle="Manage your headless CMS"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => onNavigate('cms-test')}
                                    className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900"
                                >
                                    🧪 Test CMS Connection
                                    <ChevronRightIcon className="h-5 w-5 text-ink-400" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onNavigate('cms-admin')}
                                    className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900"
                                >
                                    ⚙️ Admin Dashboard
                                    <ChevronRightIcon className="h-5 w-5 text-ink-400" />
                                </button>
                            </div>
                        </SectionCard>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onLogout, onShowAuth, onPreferencesChange, onAvatarChange, celebrations, onShowMission, onNavigate }) => {
    if (!currentUser) {
        return <LoggedOutView onShowAuth={onShowAuth} />;
    }

    return (
        <LoggedInView
            user={currentUser}
            celebrations={celebrations}
            onLogout={onLogout}
            onPreferencesChange={onPreferencesChange}
            onAvatarChange={onAvatarChange}
            onShowMission={onShowMission}
            onNavigate={onNavigate}
        />
    );
};