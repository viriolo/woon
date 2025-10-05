import React, { useEffect, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Celebration, SpecialDay, UserLocation } from "../../../types";
import type { TodaySheetState } from "./types";
import { TodayMap } from "./components/TodayMap";
import { SpecialDayBadge } from "./components/SpecialDayBadge";
import { CelebrationBottomSheet } from "./components/CelebrationBottomSheet";
import { SearchBar } from "./components/SearchBar";
import type { OfflineActionInput, OfflineAction } from "../../utils/offlineQueue";

interface TodayViewProps {
  specialDay: SpecialDay;
  tomorrowSpecialDay: SpecialDay;
  celebrations: Celebration[];
  isLoading: boolean;
  errorMessage: string | null;
  location: UserLocation | null;
  locationLoading: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
  onSelectCelebration: (celebration: Celebration | null, mode?: "preview" | "detail") => void;
  selectedCelebration: Celebration | null;
  sheetState: TodaySheetState;
  onSheetStateChange: Dispatch<SetStateAction<TodaySheetState>>;
  onToggleLike: (celebration: Celebration) => void;
  onToggleSave: (celebration: Celebration) => void;
  requireAuth: (message: string, action?: () => void) => boolean;
  isGuest: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
  isOnline: boolean;
  enqueueOfflineAction: (action: OfflineActionInput) => OfflineAction;
}

export const TodayView: React.FC<TodayViewProps> = ({
  specialDay,
  tomorrowSpecialDay,
  celebrations,
  isLoading,
  errorMessage,
  location,
  locationLoading,
  locationError,
  onRequestLocation,
  onSelectCelebration,
  selectedCelebration,
  sheetState,
  onSheetStateChange,
  onToggleLike,
  onToggleSave,
  requireAuth,
  isGuest,
  searchTerm,
  onSearchTermChange,
  isSearchOpen,
  onCloseSearch,
  isOnline,
  enqueueOfflineAction,
}) => {
  const mapCelebrations = useMemo(() => celebrations, [celebrations]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSearchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseSearch();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSearchOpen, onCloseSearch]);

  return (
    <div className="today-view">
      <div className="today-view__map">
        <TodayMap
          celebrations={mapCelebrations}
          userLocation={location}
          isLoading={isLoading}
          selectedCelebrationId={selectedCelebration?.id ?? null}
          onSelectCelebration={(celebration) => onSelectCelebration(celebration, "detail")}
        />
      </div>

      <div className="today-view__overlay">
        <SpecialDayBadge
          specialDay={specialDay}
          tomorrowSpecialDay={tomorrowSpecialDay}
          isLoading={isLoading}
        />

        {locationError ? (
          <div className="today-view__location-warning">
            <p>{locationError}</p>
            <button type="button" className="btn btn-secondary" onClick={onRequestLocation}>
              Try again
            </button>
          </div>
        ) : locationLoading && !location ? (
          <div className="today-view__location-warning today-view__location-warning--pending">
            <p>Calibrating your location...</p>
          </div>
        ) : null}
      </div>

      {isSearchOpen && (
        <div className="today-search-overlay" role="dialog" aria-modal="true">
          <div className="today-search-overlay__backdrop" onClick={onCloseSearch} />
          <div className="today-search-overlay__surface">
            <SearchBar
              value={searchTerm}
              onChange={onSearchTermChange}
              placeholder="Search celebrations or creators"
              inputRef={searchInputRef}
            />
            <p className="today-search-overlay__hint">Find themes, neighbors, or saved celebrations.</p>
            <button type="button" className="today-search-overlay__close" onClick={onCloseSearch} aria-label="Close search">
              Close
            </button>
          </div>
        </div>
      )}

      <CelebrationBottomSheet
        celebrations={celebrations}
        isLoading={isLoading}
        errorMessage={errorMessage}
        tomorrowSpecialDay={tomorrowSpecialDay}
        sheetState={sheetState}
        onSheetStateChange={onSheetStateChange}
        onSelectCelebration={(celebration, mode) => onSelectCelebration(celebration, mode)}
        selectedCelebration={selectedCelebration}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
        requireAuth={requireAuth}
        isGuest={isGuest}
        isOnline={isOnline}
        enqueueOfflineAction={enqueueOfflineAction}
      />
    </div>
  );
};
