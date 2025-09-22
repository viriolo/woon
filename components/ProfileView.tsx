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
    <div className="flex w-full flex-col items-center gap-4 text-center text-ink-900">
        <div className="glass-panel max-w-md px-10 py-12 space-y-4">
            <h2 className="text-heading text-3xl">Your profile</h2>
            <p className="text-sm text-ink-500">Sign in to save celebrations, share creations, and follow neighbors.</p>
            <button type="button" onClick={onShowAuth} className="pill-button pill-accent w-full justify-center">
                Log in or sign up
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
        <div className="flex w-full flex-col gap-8 text-ink-900">
            <section className="glass-panel relative overflow-hidden px-6 py-8">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-dark to-transparent opacity-80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent)]" />
                <div className="relative flex flex-col gap-6 text-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={user.avatarUrl ?? "https://i.pravatar.cc/150?img=5"} alt={user.name} className="h-28 w-28 rounded-3xl object-cover shadow-brand" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -right-3 -bottom-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-900 shadow-lg"
                                >
                                    <CameraIcon className="h-5 w-5" />
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-heading text-3xl text-white">{user.name}</h1>
                                <p className="text-sm text-white/80">@{user.handle ?? user.email.split("@")[0]}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button type="button" className="pill-button pill-muted bg-white/20 text-white">
                                Edit profile
                            </button>
                            <button type="button" onClick={onLogout} className="pill-button pill-accent bg-white text-ink-900">
                                Log out
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {stats.map(stat => (
                            <span key={stat.label} className="tag-chip bg-white/20 text-white">
                                {stat.label}: {stat.value}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <SectionCard title="Shared celebrations" subtitle="Stories you've posted to the map.">
                <MediaRail celebrations={userCelebrations} emptyCopy="You haven't posted any celebrations yet. Share one today!" />
            </SectionCard>

            <SectionCard title="Saved for later" subtitle="Quick access to the celebrations you bookmarked.">
                <MediaRail celebrations={savedCelebrations} emptyCopy="Tap the bookmark icon on a celebration to save it here." />
            </SectionCard>

            <SectionCard title="Notifications & preferences">
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

            <SectionCard title="Achievements" subtitle="Collect badges as you host, join, and celebrate.">
                <AchievementsList achievements={user.achievements} />
            </SectionCard>

            <SectionCard
                title="About Woon"
                subtitle="Learn more about how we celebrate together."
                action={(
                    <button type="button" onClick={onShowMission} className="pill-button pill-accent">
                        <SparklesIcon className="h-5 w-5" /> View mission
                    </button>
                )}
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                        Celebration interests
                        <ChevronRightIcon className="h-5 w-5 text-ink-400" />
                    </button>
                    <button type="button" className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                        Privacy & community settings
                        <ShieldCheckIcon className="h-5 w-5 text-ink-400" />
                    </button>
                    <button type="button" className="flex items-center justify-between rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900">
                        Manage subscription
                        <CogIcon className="h-5 w-5 text-ink-400" />
                    </button>
                </div>
            </SectionCard>
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
