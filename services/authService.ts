import type { User, NotificationPreferences, Achievement } from "../types";

const USERS_STORAGE_KEY = "woon_users";
const SESSION_STORAGE_KEY = "woon_session_email";

interface StoredUser extends User {
    passwordHash: string;
}

const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000];
const EXPERIENCE_PER_CELEBRATION = 75;
const EXPERIENCE_PER_EVENT = 50;

const generateHandle = (name: string) => {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (sanitized.length > 0) {
        return sanitized;
    }
    const condensed = name.toLowerCase().replace(/\s+/g, "");
    return condensed || name.toLowerCase();
};

const ensureUserDefaults = (user: StoredUser): StoredUser => {
    user.handle = user.handle ?? generateHandle(user.name);
    user.bio = user.bio ?? '';
    user.location = user.location ?? '';
    user.likedCelebrationIds = user.likedCelebrationIds ?? [];
    user.savedCelebrationIds = user.savedCelebrationIds ?? [];
    user.rsvpedEventIds = user.rsvpedEventIds ?? [];
    user.followingUserIds = user.followingUserIds ?? [];
    user.followerUserIds = user.followerUserIds ?? [];
    user.followingCount = user.followingUserIds.length;
    user.followersCount = user.followerUserIds.length;
    user.subscriptionTier = user.subscriptionTier ?? 'free';
    user.streakDays = user.streakDays ?? 1;
    user.experiencePoints = user.experiencePoints ?? 0;
    user.level = user.level ?? 1;
    user.achievements = user.achievements ?? [];
    return user;
};

const getStoredUsers = (): StoredUser[] => {
    try {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        const parsed: StoredUser[] = users ? JSON.parse(users) : [];
        return parsed.map(ensureUserDefaults);
    } catch (error) {
        console.error("Failed to parse users from localStorage", error);
        return [];
    }
};

const saveStoredUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "woon_salt_2024");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const recalculateLevel = (user: StoredUser) => {
    const nextLevel = LEVEL_THRESHOLDS.reduce((level, threshold, index) => {
        if (user.experiencePoints >= threshold) {
            return index + 1;
        }
        return level;
    }, 1);
    user.level = nextLevel;
};

const addExperience = (user: StoredUser, amount: number) => {
    user.experiencePoints += amount;
    recalculateLevel(user);
};

const awardAchievement = (user: StoredUser, achievement: Achievement) => {
    const alreadyEarned = user.achievements.some(item => item.id === achievement.id);
    if (!alreadyEarned) {
        user.achievements.push(achievement);
    }
};

const getUserFromStored = (email: string | null): User | null => {
    if (!email) return null;
    const users = getStoredUsers();
    const storedUser = users.find(u => u.email === email);
    if (!storedUser) return null;

    const { passwordHash, ...user } = storedUser;
    return user;
};

const writeUser = (users: StoredUser[], index: number, updater: (user: StoredUser) => void): User => {
    const user = ensureUserDefaults(users[index]);
    updater(user);
    ensureUserDefaults(user);
    saveStoredUsers(users);
    const { passwordHash, ...publicUser } = user;
    return publicUser as User;
};

export const authService = {
    signUp: async (name: string, email: string, password: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 500));
        const users = getStoredUsers();
        if (users.some(u => u.email === email)) {
            throw new Error("An account with this email already exists.");
        }

        const now = new Date().toISOString();
        const hashedPassword = await hashPassword(password);
        const newUser: StoredUser = ensureUserDefaults({
            id: now,
            name,
            email,
            passwordHash: hashedPassword,
            avatarUrl: undefined,
            handle: generateHandle(name),
            notificationPreferences: {
                dailySpecialDay: true,
                communityActivity: true,
            },
            likedCelebrationIds: [],
            savedCelebrationIds: [],
            rsvpedEventIds: [],
            followingUserIds: [],
            followerUserIds: [],
            followingCount: 0,
            followersCount: 0,
            subscriptionTier: 'free',
            streakDays: 1,
            experiencePoints: 0,
            achievements: [{
                id: "first_login",
                name: "First Steps",
                description: "Signed in to begin your celebration journey.",
                earnedAt: now,
            }],
            level: 1,
        });

        users.push(newUser);
        saveStoredUsers(users);
        localStorage.setItem(SESSION_STORAGE_KEY, email);

        const { passwordHash, ...userToReturn } = newUser;
        return userToReturn;
    },

    logIn: async (email: string, password: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 500));
        const users = getStoredUsers();
        const storedUser = users.find(u => u.email === email);

        const hashedPassword = await hashPassword(password);
        if (!storedUser || storedUser.passwordHash !== hashedPassword) {
            throw new Error("Invalid email or password.");
        }

        localStorage.setItem(SESSION_STORAGE_KEY, email);
        const { passwordHash, ...userToReturn } = storedUser;
        return userToReturn;
    },

    socialLogIn: async (): Promise<User> => {
        await new Promise(res => setTimeout(res, 700));
        const users = getStoredUsers();

        const mockEmail = 'social_user_google@example.com';
        const mockName = 'Google User';

        let storedUser = users.find(u => u.email === mockEmail);

        if (!storedUser) {
            const now = new Date().toISOString();
            const newUser: StoredUser = ensureUserDefaults({
                id: now,
                name: mockName,
                email: mockEmail,
                passwordHash: await hashPassword("social_login_dummy_password"),
                avatarUrl: undefined,
                handle: generateHandle(mockName),
                notificationPreferences: {
                    dailySpecialDay: true,
                    communityActivity: true,
                },
                likedCelebrationIds: [],
                savedCelebrationIds: [],
                rsvpedEventIds: [],
                followingUserIds: [],
                streakDays: 1,
                experiencePoints: 0,
                achievements: [{
                    id: "first_login",
                    name: "First Steps",
                    description: "Signed in to begin your celebration journey.",
                    earnedAt: now,
                }],
                level: 1,
            });
            users.push(newUser);
            saveStoredUsers(users);
            storedUser = newUser;
        }

        localStorage.setItem(SESSION_STORAGE_KEY, storedUser.email);
        const { passwordHash, ...userToReturn } = storedUser;
        return userToReturn;
    },

    logOut: async (): Promise<void> => {
        await new Promise(res => setTimeout(res, 300));
        localStorage.removeItem(SESSION_STORAGE_KEY);
    },

    checkSession: (): User | null => {
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        return getUserFromStored(email);
    },

    updateNotificationPreferences: async (prefs: Partial<NotificationPreferences>): Promise<User> => {
        await new Promise(res => setTimeout(res, 300));
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) throw new Error("User not found.");

        return writeUser(users, index, user => {
            user.notificationPreferences = {
                ...user.notificationPreferences,
                ...prefs,
            };
        });
    },

    toggleLikeStatus: async (celebrationId: number): Promise<User> => {
        await new Promise(res => setTimeout(res, 100));
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) throw new Error("User not found.");

        return writeUser(users, index, user => {
            const isLiked = user.likedCelebrationIds.includes(celebrationId);
            if (isLiked) {
                user.likedCelebrationIds = user.likedCelebrationIds.filter(id => id !== celebrationId);
            } else {
                user.likedCelebrationIds.push(celebrationId);
                addExperience(user, 5);
            }
        });
    },

    toggleSaveStatus: async (celebrationId: number): Promise<User> => {
        await new Promise(res => setTimeout(res, 100));
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) throw new Error("User not found.");

        return writeUser(users, index, user => {
            const isSaved = user.savedCelebrationIds.includes(celebrationId);
            if (isSaved) {
                user.savedCelebrationIds = user.savedCelebrationIds.filter(id => id !== celebrationId);
            } else {
                user.savedCelebrationIds.push(celebrationId);
                addExperience(user, 5);
            }
        });
    },

    toggleFollowStatus: async (targetUserId: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 150));
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) throw new Error("User not found.");

        return writeUser(users, index, user => {
            if (user.id === targetUserId) {
                return;
            }
            const isFollowing = user.followingUserIds.includes(targetUserId);
            if (isFollowing) {
                user.followingUserIds = user.followingUserIds.filter(id => id !== targetUserId);
            } else {
                user.followingUserIds.push(targetUserId);
                addExperience(user, 10);
            }
        });
    },

    toggleRsvpStatus: async (eventId: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 100));
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) throw new Error("User not found.");

        return writeUser(users, index, user => {
            const isRsvped = user.rsvpedEventIds.includes(eventId);
            if (isRsvped) {
                user.rsvpedEventIds = user.rsvpedEventIds.filter(id => id !== eventId);
            } else {
                user.rsvpedEventIds.push(eventId);
                addExperience(user, EXPERIENCE_PER_EVENT / 2);
            }
        });
    },

    updateAvatar: async (base64Image: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 500));
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) throw new Error("User not found.");

        return writeUser(users, index, user => {
            user.avatarUrl = base64Image;
        });
    },

    recordCelebrationContribution: async (): Promise<User> => {
        await new Promise(res => setTimeout(res, 100));
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) throw new Error("User not found.");

        return writeUser(users, index, user => {
            user.streakDays = Math.min(user.streakDays + 1, 365);
            addExperience(user, EXPERIENCE_PER_CELEBRATION);
            if (user.streakDays === 7) {
                awardAchievement(user, {
                    id: "streak_7",
                    name: "One Week Wonder",
                    description: "Celebrated seven days in a row.",
                    earnedAt: new Date().toISOString(),
                });
            }
        });
    },

    recordEventContribution: async (): Promise<User> => {
        await new Promise(res => setTimeout(res, 120));
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) throw new Error("User not found.");

        return writeUser(users, index, user => {
            addExperience(user, EXPERIENCE_PER_EVENT);
            awardAchievement(user, {
                id: "event_host",
                name: "Community Host",
                description: "Published your first community event.",
                earnedAt: new Date().toISOString(),
            });
        });
    },
};
