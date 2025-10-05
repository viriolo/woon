import React from "react";
import type { Celebration } from "../../../../types";

interface CelebrationPreviewCardProps {
  celebration: Celebration;
  onSelect: (celebration: Celebration) => void;
  isActive: boolean;
}

export const CelebrationPreviewCard: React.FC<CelebrationPreviewCardProps> = ({ celebration, onSelect, isActive }) => {
  return (
    <button
      type="button"
      className={`celebration-preview-card${isActive ? " celebration-preview-card--active" : ""}`}
      onClick={() => onSelect(celebration)}
    >
      <div
        className="celebration-preview-card__image"
        style={{ backgroundImage: `url(${celebration.imageUrl})` }}
        aria-hidden="true"
      />
      <div className="celebration-preview-card__body">
        <h3 className="celebration-preview-card__title">{celebration.title}</h3>
        <p className="celebration-preview-card__meta">By {celebration.author}</p>
      </div>
    </button>
  );
};
