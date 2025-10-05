import React, { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Celebration, UserLocation } from "../../../types";
import type { AuthUser } from "../../services/authService";
import { celebrationService } from "../../../services/celebrationService";
import { MediaService } from "../../lib/cms";
import type { OfflineActionInput, OfflineAction } from "../../utils/offlineQueue";

interface ShareViewProps {
  currentUser: AuthUser | null;
  requireAuth: (message: string, action?: () => void) => boolean;
  onCelebrationCreated: (celebration: Celebration) => void;
  location: UserLocation | null;
  locationError: string | null;
  requestLocation: () => Promise<boolean>;
  isOnline: boolean;
  enqueueOfflineAction: (action: OfflineActionInput) => OfflineAction | null;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;

export const ShareView: React.FC<ShareViewProps> = ({
  currentUser,
  requireAuth,
  onCelebrationCreated,
  location,
  locationError,
  requestLocation,
  isOnline,
  enqueueOfflineAction,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraPromptAckRef = useRef<boolean>(typeof window !== "undefined" && !!window.localStorage.getItem("woon-camera-prompt"));
  const handleFileInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    if (cameraPromptAckRef.current) {
      return;
    }
    if (typeof window !== "undefined") {
      const proceed = window.confirm("Allow camera access to capture a new celebration photo? You can still upload from your gallery.");
      if (!proceed) {
        event.preventDefault();
        event.stopPropagation();
        setInfoMessage("You can still upload from your gallery below.");
        return;
      }
      window.localStorage.setItem("woon-camera-prompt", "ack");
    }
    cameraPromptAckRef.current = true;
  };
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const isReadyToSubmit = useMemo(() => {
    return Boolean(title.trim() && file && location && !isSubmitting);
  }, [title, file, location, isSubmitting]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setFileDataUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setFile(null);
      setFileDataUrl(null);
      setPreviewUrl(null);
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setError("Image must be under 10MB.");
      return;
    }

    const tempUrl = URL.createObjectURL(nextFile);
    const image = new Image();
    image.onload = () => {
      if (image.width < MIN_WIDTH || image.height < MIN_HEIGHT) {
        setError(`Image should be at least ${MIN_WIDTH}x${MIN_HEIGHT} pixels.`);
        URL.revokeObjectURL(tempUrl);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setFileDataUrl(reader.result as string);
      };
      reader.readAsDataURL(nextFile);

      setFile(nextFile);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(tempUrl);
      setError(null);
      setInfoMessage(null);
    };

    image.onerror = () => {
      setError("We couldn't read that image. Try another file.");
      URL.revokeObjectURL(tempUrl);
    };

    image.src = tempUrl;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!currentUser) {
      requireAuth("Sign in to post your celebration");
      return;
    }

    if (!file || !location) {
      setError("Add a photo and share location to continue.");
      return;
    }

    if (!isOnline) {
      if (!fileDataUrl) {
        setError("Your image is still loading. Please try again in a moment.");
        return;
      }
      const offlineEntry = enqueueOfflineAction({
        type: "celebration",
        payload: {
          celebrationData: {
            title: title.trim(),
            description: description.trim(),
            imageDataUrl: fileDataUrl,
          },
          userId: currentUser.id,
          location,
          createdAt: new Date().toISOString(),
        },
      });
      if (!offlineEntry) {
        setError("We need storage permission to queue offline posts.");
        return;
      }
      resetForm();
      setInfoMessage("You're offline. We'll share your celebration once you're reconnected.");
      return;
    }

    const run = async () => {
      try {
        setIsSubmitting(true);
        setError(null);
        setInfoMessage(null);

        const media = await MediaService.uploadFile(file);
        const created = await celebrationService.createCelebration(
          {
            title: title.trim(),
            description: description.trim(),
            imageUrl: media.storage_path,
          },
          currentUser,
          location
        );

        onCelebrationCreated(created);
        resetForm();
        if (navigator.vibrate) {
          navigator.vibrate(15);
        }
      } catch (err: any) {
        console.error("Failed to create celebration", err);
        setError(err?.message || "Upload failed. Check your connection and try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    await run();
  };

  if (!currentUser) {
    return (
      <div className="share-view share-view--locked">
        <h2>Share your celebration</h2>
        <p>Sign in to capture today's magic and inspire neighbours.</p>
        <button type="button" className="btn" onClick={() => requireAuth("Sign in to post your celebration")}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="share-view">
      <header className="share-view__header">
        <h2>Share today's celebration</h2>
        <p>Snap a moment, add a few words, and place it on the map for neighbours to enjoy.</p>
      </header>

      <form className="share-form" onSubmit={handleSubmit}>
        <div className="share-form__section">
          <label className="share-form__upload">
            <span className="share-form__upload-label">Photo or video</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onClick={handleFileInputClick} onChange={handleFileChange} capture="environment" />
            {previewUrl ? (
              <img src={previewUrl} alt="Celebration preview" />
            ) : (
              <div className="share-form__upload-placeholder">Tap to upload from gallery or camera</div>
            )}
          </label>
        </div>

        <label className="share-form__field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your celebration a name"
            required
          />
        </label>

        <label className="share-form__field">
          <span>Description</span>
          <textarea
            value={description}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tell neighbours what makes today special (optional)"
            rows={4}
          />
        </label>

        <div className="share-form__location">
          <span>Location</span>
          {location ? (
            <p>Sharing from approximately {location.lat.toFixed(3)}, {location.lng.toFixed(3)}</p>
          ) : locationError ? (
            <div className="share-form__location-warning">
              <p>{locationError}</p>
              <button type="button" className="btn btn-secondary" onClick={requestLocation}>
                Enable location
              </button>
            </div>
          ) : (
            <p>Requesting location...</p>
          )}
        </div>

        {error && <p className="share-form__error">{error}</p>}
        {infoMessage && <p className="share-form__info">{infoMessage}</p>}

        <button type="submit" className="btn btn-primary" disabled={!isReadyToSubmit}>
          {isSubmitting ? "Publishing..." : "Post celebration"}
        </button>
      </form>
    </div>
  );
};
