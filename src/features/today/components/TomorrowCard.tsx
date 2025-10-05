import React from "react";
import type { SpecialDay } from "../../../../types";

interface TomorrowCardProps {
  specialDay: SpecialDay;
}

export const TomorrowCard: React.FC<TomorrowCardProps> = ({ specialDay }) => {
  return (
    <div className="tomorrow-card">
      <span className="tomorrow-card__label">Tomorrow</span>
      <h3 className="tomorrow-card__title">{specialDay.title}</h3>
      <p className="tomorrow-card__meta">{specialDay.date}</p>
    </div>
  );
};
