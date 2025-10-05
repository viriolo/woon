import React, { useMemo, useState } from "react";
import type { Celebration } from "../../../types";
import type { AuthUser } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

interface ProfileViewProps {
  user: AuthUser | null;
  celebrations: Celebration[];
  onSignOut: () => Promise<void> | void;
  onSelectCelebration: (celebration: Celebration, mode?: "preview" | "detail") => void;
  requireAuth: (message: string, action?: () => void) => boolean;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  celebrations,
  onSignOut,
  onSelectCelebration,
  requireAuth,
}) => {
  const { updateAvatar, updateNotificationPreferences } = useAuth();
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const myCelebrations = useMemo(() => {
    if (!user) return [];
    return celebrations.filter((celebration) => celebration.authorId === user.id);
  }, [celebrations, user]);

  const savedCelebrations = useMemo(() => {
    if (!user) return [];
    const ids = new Set(user.savedCelebrationIds.map(Number));
    return celebrations.filter((celebration) => ids.has(celebration.id));
  }, [celebrations, user]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUpdatingAvatar(true);
      const base64 = await readFileAsDataUrl(file);
      await updateAvatar(base64);
      setProfileMessage("Avatar updated");
    } catch (error) {
      console.error("Avatar update failed", error);
      setProfileMessage("Unable to update avatar");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission === 'denied') {
      return false;
    }
    const promptKey = 'woon-notification-prompt';
    if (!window.localStorage.getItem(promptKey)) {
      const proceed = window.confirm('Enable notifications to get daily special day reminders and event updates?');
      window.localStorage.setItem(promptKey, 'shown');
      if (!proceed) {
        return false;
      }
    }
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  const handleNotificationToggle = async (key: keyof AuthUser["notificationPreferences"]) => {
    if (!user) {
      requireAuth("Sign in to update preferences");
      return;
    }

    const nextValue = !user.notificationPreferences[key];
    try {
      if (nextValue && (key === 'dailySpecialDay' || key === 'eventReminders')) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          setProfileMessage("Enable browser notifications to receive reminders.");
          return;
        }
      }

      await updateNotificationPreferences({
        ...user.notificationPreferences,
        [key]: nextValue,
      });
      setProfileMessage("Preferences updated");
    } catch (error) {
      console.error("Failed to update notification preferences", error);
      setProfileMessage("Unable to update preferences");
    }
  };

  if (!user) {
    return (
      <div className="profile-view profile-view--guest">
        <h2>Your profile</h2>
        <p>Sign in to see your celebration streak, saved moments, and notifications.</p>
        <button type="button" className="btn" onClick={() => requireAuth("Sign in to view your profile")}>Sign in</button>
      </div>
    );
  }

  return (
    <div className="profile-view">
      <header className="profile-view__header">
        <div className="profile-view__avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`${user.name}'s avatar`} />
          ) : (
            <span>{user.name.slice(0, 1)}</span>
          )}
          <label className="profile-view__avatar-upload">
            <span>Change</span>
            <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarChange} disabled={isUpdatingAvatar} />
          </label>
        </div>
        <div>
          <h2>{user.name}</h2>
          {user.handle && <p>@{user.handle}</p>}
          <p>Celebration streak: {user.streakDays} days</p>
        </div>
      </header>

      {profileMessage && <p className="profile-view__message">{profileMessage}</p>}

      <section className="profile-section">
        <h3>Notification preferences</h3>
        <ul className="profile-preferences">
          {Object.entries(user.notificationPreferences).map(([key, value]) => (
            <li key={key}>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={() => handleNotificationToggle(key as keyof AuthUser["notificationPreferences"])}
                />
                <span>{key.replace(/([A-Z])/g, " $1").trim()}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="profile-section">
        <h3>My celebrations</h3>
        {myCelebrations.length === 0 ? (
          <p>You haven't shared a celebration yet.</p>
        ) : (
          <ul className="profile-celebrations">
            {myCelebrations.map((celebration) => (
              <li key={celebration.id}>
                <button type="button" onClick={() => onSelectCelebration(celebration, "detail")}>{celebration.title}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profile-section">
        <h3>Saved celebrations</h3>
        {savedCelebrations.length === 0 ? (
          <p>Save celebrations you love to revisit them later.</p>
        ) : (
          <ul className="profile-celebrations">
            {savedCelebrations.map((celebration) => (
              <li key={`saved-${celebration.id}`}>
                <button type="button" onClick={() => onSelectCelebration(celebration, "detail")}>{celebration.title}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="profile-view__footer">
        <button type="button" className="btn btn-tertiary" onClick={() => onSignOut()}>
          Log out
        </button>
      </div>
    </div>
  );
};
