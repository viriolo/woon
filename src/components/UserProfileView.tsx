import React, { useRef, useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { celebrationService } from "../services/celebrationService"
import type { Celebration } from "../types"
import {
    SparklesIcon,
    ChevronRightIcon,
    CameraIcon,
    StarIcon,
    ShieldCheckIcon,
    CogIcon,
    HeartIcon,
    BookmarkIcon,
} from "../../components/icons"

interface UserProfileViewProps {
    onNavigate?: (tab: string) => void
    onShowMission?: () => void
}

const SectionCard: React.FC<{
    title: string
    subtitle?: string
    action?: React.ReactNode
    children: React.ReactNode
}> = ({ title, subtitle, action, children }) => (
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
)

const ToggleRow: React.FC<{
    label: string
    description: string
    enabled: boolean
    onToggle: (value: boolean) => void
}> = ({ label, description, enabled, onToggle }) => (
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
)


export default function UserProfileView({ onNavigate, onShowMission }: UserProfileViewProps) {
    const { user, logOut, updateAvatar, updateNotificationPreferences, updateProfile } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [activeTab, setActiveTab] = useState<'my-celebrations' | 'saved-celebrations'>('my-celebrations')
    const [isEditing, setIsEditing] = useState(false)
    const [myCelebrations, setMyCelebrations] = useState<Celebration[]>([])
    const [savedCelebrations, setSavedCelebrations] = useState<Celebration[]>([])
    const [isLoadingCelebrations, setIsLoadingCelebrations] = useState(true)
    const [editForm, setEditForm] = useState({
        name: user?.name || '',
        handle: user?.handle || '',
        bio: user?.bio || '',
        location: user?.location || ''
    })

    // Load user's celebrations
    useEffect(() => {
        const loadCelebrations = async () => {
            if (!user) return

            setIsLoadingCelebrations(true)
            try {
                const allCelebrations = await celebrationService.getCelebrations()

                // Filter user's own celebrations
                const userCelebrations = allCelebrations.filter(c => c.author === user.name)
                setMyCelebrations(userCelebrations)

                // Filter saved celebrations
                const saved = allCelebrations.filter(c => user.savedCelebrationIds.includes(c.id))
                setSavedCelebrations(saved)
            } catch (error) {
                console.error('Failed to load celebrations:', error)
            } finally {
                setIsLoadingCelebrations(false)
            }
        }

        loadCelebrations()
    }, [user])

    if (!user) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center px-6">
                <div className="surface-card max-w-md w-full px-8 py-12 space-y-6 text-center">
                    <div className="space-y-2">
                        <h2 className="text-heading text-3xl text-ink-900">Your Profile</h2>
                        <p className="text-body text-ink-500">
                            Sign in to manage your profile and track your achievements.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = async () => {
            try {
                await updateAvatar(reader.result as string)
            } catch (error) {
                console.error('Failed to update avatar:', error)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleSaveProfile = async () => {
        try {
            await updateProfile(editForm)
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update profile:', error)
        }
    }


    return (
        <div className="min-h-screen bg-surface">
            {/* Clean Header */}
            <header className="surface-elevated px-6 py-4">
                <div className="flex items-center justify-center">
                    <h1 className="text-heading text-xl text-ink-900">Profile</h1>
                </div>
            </header>

            <div className="px-6 py-8">
                {/* Centered Profile Info */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-4">
                        <img
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
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
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </div>

                    {isEditing ? (
                        <div className="space-y-4 max-w-sm mx-auto">
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2 text-center text-lg font-semibold"
                                placeholder="Your name"
                            />
                            <input
                                type="text"
                                value={editForm.handle}
                                onChange={(e) => setEditForm(prev => ({ ...prev, handle: e.target.value }))}
                                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2 text-center text-sm"
                                placeholder="@handle"
                            />
                            <textarea
                                value={editForm.bio}
                                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2 text-center text-sm"
                                placeholder="Tell us about yourself..."
                                rows={3}
                            />
                            <input
                                type="text"
                                value={editForm.location}
                                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2 text-center text-sm"
                                placeholder="Location"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="pill-button pill-muted flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    className="pill-button pill-accent flex-1"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-heading text-2xl text-ink-900 mb-2">{user.name}</h2>
                            <p className="text-body text-ink-500 mb-2">@{user.handle || 'user'}</p>
                            {user.bio && <p className="text-sm text-ink-600 mb-2">{user.bio}</p>}
                            {user.location && <p className="text-xs text-ink-400 mb-4">📍 {user.location}</p>}
                            <button
                                onClick={() => {
                                    setEditForm({
                                        name: user.name,
                                        handle: user.handle || '',
                                        bio: user.bio || '',
                                        location: user.location || ''
                                    })
                                    setIsEditing(true)
                                }}
                                className="pill-button pill-muted text-sm"
                            >
                                Edit Profile
                            </button>
                        </>
                    )}

                    {/* Celebration Streak Highlight */}
                    <div className="max-w-xs mx-auto mt-8">
                        <div className="surface-card px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <StarIcon className="h-5 w-5 text-primary" />
                                <span className="text-heading text-lg text-ink-900">{user.streakDays} days</span>
                            </div>
                            <p className="text-caption text-ink-500">Celebration Streak</p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-ink-100 mb-6">
                    <nav className="flex gap-6 justify-center">
                        {[
                            { id: 'my-celebrations', label: 'My Celebrations', count: myCelebrations.length },
                            { id: 'saved-celebrations', label: 'Saved', count: savedCelebrations.length },
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
                {activeTab === 'my-celebrations' && (
                    <div>
                        {isLoadingCelebrations ? (
                            <div className="text-center py-8">
                                <div className="text-ink-500">Loading celebrations...</div>
                            </div>
                        ) : myCelebrations.length > 0 ? (
                            <div className="overflow-x-auto">
                                <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                                    {myCelebrations.map(celebration => (
                                        <div key={celebration.id} className="w-64 surface-card p-4 space-y-3">
                                            <img
                                                src={celebration.imageUrl}
                                                alt={celebration.title}
                                                className="w-full h-40 object-cover rounded-xl"
                                            />
                                            <div>
                                                <h3 className="text-heading text-sm font-semibold text-ink-900 truncate">{celebration.title}</h3>
                                                <p className="text-xs text-ink-500 line-clamp-2 mt-1">{celebration.description}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-ink-400">
                                                <div className="flex items-center gap-1">
                                                    <HeartIcon className="h-3 w-3" />
                                                    {celebration.likes}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    💬 {celebration.commentCount || 0}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-ink-500 mb-2">No celebrations yet</div>
                                <p className="text-sm text-ink-400">Share your first celebration to get started!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved-celebrations' && (
                    <div>
                        {isLoadingCelebrations ? (
                            <div className="text-center py-8">
                                <div className="text-ink-500">Loading saved celebrations...</div>
                            </div>
                        ) : savedCelebrations.length > 0 ? (
                            <div className="overflow-x-auto">
                                <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                                    {savedCelebrations.map(celebration => (
                                        <div key={celebration.id} className="w-64 surface-card p-4 space-y-3">
                                            <img
                                                src={celebration.imageUrl}
                                                alt={celebration.title}
                                                className="w-full h-40 object-cover rounded-xl"
                                            />
                                            <div>
                                                <h3 className="text-heading text-sm font-semibold text-ink-900 truncate">{celebration.title}</h3>
                                                <p className="text-caption text-xs text-ink-500">by {celebration.author}</p>
                                                <p className="text-xs text-ink-500 line-clamp-2 mt-1">{celebration.description}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-ink-400">
                                                <div className="flex items-center gap-1">
                                                    <HeartIcon className="h-3 w-3" />
                                                    {celebration.likes}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <BookmarkIcon className="h-3 w-3 text-primary" />
                                                    Saved
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-ink-500 mb-2">No saved celebrations</div>
                                <p className="text-sm text-ink-400">Save celebrations you love to find them here!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Section */}
                <div className="mt-12 space-y-6">
                    <SectionCard title="Preferences">
                        <div className="flex flex-col gap-3">
                            <ToggleRow
                                label="Daily alerts"
                                description="Get notified about today's special day."
                                enabled={user.notificationPreferences.dailySpecialDay}
                                onToggle={(value) => updateNotificationPreferences({ ...user.notificationPreferences, dailySpecialDay: value })}
                            />
                            <ToggleRow
                                label="Community activity"
                                description="Updates from neighbors and events."
                                enabled={user.notificationPreferences.communityActivity}
                                onToggle={(value) => updateNotificationPreferences({ ...user.notificationPreferences, communityActivity: value })}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard title="About & Account">
                        <div className="space-y-3">
                            {onShowMission && (
                                <button
                                    type="button"
                                    onClick={onShowMission}
                                    className="flex items-center justify-between w-full rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-ink-900"
                                >
                                    <div className="flex items-center gap-3">
                                        <SparklesIcon className="h-5 w-5 text-primary" />
                                        View Mission
                                    </div>
                                    <ChevronRightIcon className="h-5 w-5 text-ink-400" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={logOut}
                                className="flex items-center justify-between w-full rounded-2xl bg-white/80 px-5 py-4 text-left text-sm font-semibold text-red-600"
                            >
                                Log Out
                                <ChevronRightIcon className="h-5 w-5 text-red-400" />
                            </button>
                        </div>
                    </SectionCard>

                </div>
            </div>
        </div>
    )
}