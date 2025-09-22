import React, { useRef } from "react";
import type { User, NotificationPreferences, Celebration, Achievement } from "../types";
import {
    SparklesIcon,
    ChevronRightIcon,
    CameraIcon,
    StarIcon,
    ShieldCheckIcon,
    CogIcon,
} from "./icons";

interface ProfileViewProps {
    currentUser: User | null;
    onLogout: () => void;
    onShowAuth: () => void;
    onPreferencesChange: (newPrefs: Partial<NotificationPreferences>) => void;
    onAvatarChange: (base64Image: string) => void;
    celebrations: Celebration[];
    onShowMission: () => void;
}

const Shell: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, action, children }) => (
    <section className="space-y-5 rounded-3xl bg-surface-light px-6 py-6 shadow-brand ring-1 ring-white/60">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
                {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
            </div>
            {action}
        </header>
        {children}
    </section>
);

const ToggleRow: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onToggle: (value: boolean) => void;
}> = ({ label, description, enabled, onToggle }) => (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/70 px-5 py-4">
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
            <span
                aria-hidden
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-5" : "left-0.5"}`}
            />
        </button>
    </div>
);

const AchievementsList: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => (
    <div className="grid gap-4 sm:grid-cols-2">
        {achievements.length ? (
            achievements.map(achievement => (
                <div key={achievement.id} className="flex items-start gap-3 rounded-2xl bg-white/70 px-5 py-4">
                    <StarIcon className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm font-semibold text-ink-900">{achievement.name}</p>
                        <p className="text-xs text-ink-500">{achievement.description}</p>
                        <p className="mt-1 text-xs text-ink-400">Earned {achievement.earnedAt}</p>
                    </div>
                </div>
            ))
        ) : (
            <div className="rounded-2xl bg-white/70 px-5 py-4 text-sm text-ink-500">Earn achievements by sharing celebrations.</div>
        )}
    </div>
);

const MediaRail: React.FC<{ celebrations: Celebration[]; emptyCopy: string }> = ({ celebrations, emptyCopy }) => (
    celebrations.length ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
            {celebrations.map(item => (
                <div key={item.id} className="min-w-[9.5rem] space-y-3">
                    <div className="overflow-hidden rounded-2xl bg-white/70 shadow-brand">
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
        <div className="rounded-2xl bg-white/70 px-5 py-4 text-sm text-ink-500">{emptyCopy}</div>
    )
);

const LoggedOutView: React.FC<{ onShowAuth: () => void }> = ({ onShowAuth }) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-light px-6 text-center text-ink-900">
        <h2 className="text-3xl font-semibold">Your profile</h2>
        <p className="max-w-sm text-sm text-ink-500">Sign in to save celebrations, share creations, and follow neighbors.</p>
        <button
            type="button"
            onClick={onShowAuth}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-brand transition hover:scale-[1.01]"
        >
            Log in or sign up
        </button>
    </div>
);

const LoggedInView: React.FC<{
    user: User;
    celebrations: Celebration[];
    onLogout: () => void;
    onPreferencesChange: (prefs: Partial<NotificationPreferences>) => void;
    onAvatarChange: (base64Image: string) => void;
    onShowMission: () => void;
}> = ({ user, celebrations, onLogout, onPreferencesChange, onAvatarChange, onShowMission }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="relative flex min-h-screen flex-col bg-background-light text-ink-900">
            <header className="relative h-48 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-primary to-primary-dark">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent)]" />
                <div className="absolute bottom-6 left-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Profile</p>
                    <h1 className="mt-2 text-2xl font-semibold text-white">Hello, {user.name.split(" ")[0]}</h1>
                    <p className="text-sm text-white/80">Track your celebrations & community impact.</p>
                </div>
            </header>

            <main className="-mt-12 flex-1 space-y-8 overflow-y-auto px-5 pb-32">
                <section className="flex flex-col items-center gap-4 rounded-3xl bg-surface-light px-6 py-6 text-center shadow-brand ring-1 ring-white/60">
                    <div className="relative">
                        <img src={user.avatarUrl ?? "https://i.pravatar.cc/150?img=5"} alt={user.name} className="h-28 w-28 rounded-3xl object-cover shadow-brand" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -right-3 -bottom-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg"
                        >
                            <CameraIcon className="h-5 w-5" />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-semibold text-ink-900">{user.name}</p>
                        <p className="text-sm text-ink-500">@{user.handle ?? user.email.split("@")[0]}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-900 shadow-brand"
                        >
                            Edit profile
                        </button>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-brand"
                        >
                            Log out
                        </button>
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-3">
                    {stats.map(stat => (
                        <div key={stat.label} className="rounded-3xl bg-surface-light px-5 py-5 text-center shadow-brand ring-1 ring-white/60">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-400">{stat.label}</p>
                            <p className="mt-2 text-2xl font-semibold text-ink-900">{stat.value}</p>
                        </div>
                    ))}
                </section>

                <Shell title="Shared celebrations" subtitle="Stories you've posted to the map.">
                    <MediaRail celebrations={userCelebrations} emptyCopy="You haven't posted any celebrations yet. Share one today!" />
                </Shell>

                <Shell title="Saved for later" subtitle="Quick access to the celebrations you bookmarked.">
                    <MediaRail celebrations={savedCelebrations} emptyCopy="Tap the bookmark icon on a celebration to save it here." />
                </Shell>

                <Shell title="Notifications & preferences">
                    <div className="space-y-3">
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
                </Shell>

                <Shell title="Achievements" subtitle="Collect badges as you host, join, and celebrate.">
                    <AchievementsList achievements={user.achievements} />
                </Shell>

                <Shell title="About Woon" subtitle="Learn more about how we celebrate together." action={(
                    <button
                        type="button"
                        onClick={onShowMission}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
                    >
                        <SparklesIcon className="h-5 w-5" />
                        View mission
                    </button>
                )}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <button type="button" className="flex items-center justify-between rounded-2xl bg-white/70 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                            Celebration interests
                            <ChevronRightIcon className="h-5 w-5 text-ink-400" />
                        </button>
                        <button type="button" className="flex items-center justify-between rounded-2xl bg-white/70 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                            Privacy & community settings
                            <ShieldCheckIcon className="h-5 w-5 text-ink-400" />
                        </button>
                        <button type="button" className="flex items-center justify-between rounded-2xl bg-white/70 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                            Manage subscription
                            <CogIcon className="h-5 w-5 text-ink-400" />
                        </button>
                    </div>
                </Shell>
            </main>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onLogout, onShowAuth, onPreferencesChange, onAvatarChange, celebrations, onShowMission }) => {
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
        />
    );
};

