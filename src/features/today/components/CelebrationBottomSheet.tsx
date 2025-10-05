import React, { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Celebration, SpecialDay } from "../../../../types";
import type { TodaySheetMode, TodaySheetState } from "../types";
import { CelebrationPreviewCard } from "./CelebrationPreviewCard";
import { TomorrowCard } from "./TomorrowCard";
import { CelebrationDetail } from "../../celebration/CelebrationDetail";
import type { OfflineAction, OfflineActionInput } from "../../../utils/offlineQueue";

interface CelebrationBottomSheetProps {
  celebrations: Celebration[];
  isLoading: boolean;
  errorMessage: string | null;
  tomorrowSpecialDay: SpecialDay;
  sheetState: TodaySheetState;
  onSheetStateChange: Dispatch<SetStateAction<TodaySheetState>>;
  onSelectCelebration: (celebration: Celebration | null, mode?: TodaySheetMode) => void;
  selectedCelebration: Celebration | null;
  onToggleLike: (celebration: Celebration) => void;
  onToggleSave: (celebration: Celebration) => void;
  requireAuth: (message: string, action?: () => void) => boolean;
  isGuest: boolean;
  isOnline: boolean;
  enqueueOfflineAction: (action: OfflineActionInput) => OfflineAction;
}

const PREVIEW_LIMIT = 8;

export const CelebrationBottomSheet: React.FC<CelebrationBottomSheetProps> = ({
  celebrations,
  isLoading,
  errorMessage,
  tomorrowSpecialDay,
  sheetState,
  onSheetStateChange,
  onSelectCelebration,
  selectedCelebration,
  onToggleLike,
  onToggleSave,
  requireAuth,
  isGuest,
  isOnline,
  enqueueOfflineAction,
}) => {
  const previewCelebrations = useMemo(
    () => celebrations.slice(0, PREVIEW_LIMIT),
    [celebrations]
  );

  const handleExpand = (celebration: Celebration) => {
    onSelectCelebration(celebration, "detail");
  };

  const handleCloseDetail = () => {
    onSelectCelebration(null, "preview");
    onSheetStateChange(() => ({ isOpen: true, mode: "preview" }));
  };

  return (
    <section
      className={`bottom-sheet${sheetState.isOpen ? " bottom-sheet--open" : ""}${sheetState.mode === "detail" ? " bottom-sheet--detail" : ""}`}
      aria-label="Celebrations near you"
    >
      <div className="bottom-sheet__handle" />

      {sheetState.mode === "detail" && selectedCelebration ? (
        <CelebrationDetail
          celebration={selectedCelebration}
          onClose={handleCloseDetail}
          onToggleLike={() => onToggleLike(selectedCelebration)}
          onToggleSave={() => onToggleSave(selectedCelebration)}
          requireAuth={requireAuth}
          isGuest={isGuest}
          isOnline={isOnline}
          enqueueOfflineAction={enqueueOfflineAction}
        />
      ) : (
        <div className="bottom-sheet__preview">
          <div className="bottom-sheet__header">
            <h2 className="bottom-sheet__title">Nearby Celebrations</h2>
            <p className="bottom-sheet__subtitle">Swipe to explore what the community is sharing today</p>
          </div>

          {isLoading ? (
            <div className="bottom-sheet__loading">Gathering celebrations...</div>
          ) : errorMessage ? (
            <div className="bottom-sheet__error">{errorMessage}</div>
          ) : (
            <div className="bottom-sheet__carousel">
              {previewCelebrations.map((celebration) => (
                <CelebrationPreviewCard
                  key={celebration.id}
                  celebration={celebration}
                  onSelect={handleExpand}
                  isActive={selectedCelebration?.id === celebration.id}
                />
              ))}
              <TomorrowCard specialDay={tomorrowSpecialDay} />
            </div>
          )}
        </div>
      )}
    </section>
  );
};
