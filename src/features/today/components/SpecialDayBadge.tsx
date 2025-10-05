import React, { useState } from "react";
import type { SpecialDay } from "../../../../types";

interface SpecialDayBadgeProps {
  specialDay: SpecialDay;
  tomorrowSpecialDay: SpecialDay;
  isLoading: boolean;
}

export const SpecialDayBadge: React.FC<SpecialDayBadgeProps> = ({ specialDay, tomorrowSpecialDay, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="special-day-badge special-day-badge--loading" role="status">
        <div className="special-day-badge__title">Finding today's wonder…</div>
      </div>
    );
  }

  return (
    <div className={`special-day-badge${isExpanded ? " special-day-badge--expanded" : ""}`}>
      <button
        type="button"
        className="special-day-badge__button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <div className="special-day-badge__content">
          <span className="special-day-badge__label">Today's Special Day</span>
          <h2 className="special-day-badge__headline">{specialDay.title}</h2>
          <p className="special-day-badge__meta">{specialDay.date} • {specialDay.category}</p>
        </div>
      </button>

      {isExpanded && (
        <div className="special-day-badge__details">
          <p>{specialDay.description}</p>
          <div className="special-day-badge__tomorrow">
            <span className="special-day-badge__label">Up Next</span>
            <strong>{tomorrowSpecialDay.title}</strong>
            <span className="special-day-badge__meta">{tomorrowSpecialDay.date}</span>
          </div>
        </div>
      )}
    </div>
  );
};
