import type { SpecialDay } from "../../types";
import { getSpecialDayForDate, getUpcomingSpecialDay } from "../data/specialDays";

const FALLBACK_SPECIAL_DAY: SpecialDay = {
  title: "Make Your Own Holiday",
  description: "Celebrate what matters most to your community—start a new tradition today!",
  date: new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" }),
  category: "Community",
};

export const specialDayService = {
  getToday(): SpecialDay {
    const todayEntry = getSpecialDayForDate(new Date());
    return todayEntry
      ? {
          title: todayEntry.title,
          description: todayEntry.description,
          date: todayEntry.date,
          category: todayEntry.category,
        }
      : FALLBACK_SPECIAL_DAY;
  },

  getTomorrow(): SpecialDay {
    const tomorrowEntry = getUpcomingSpecialDay(1);
    return tomorrowEntry
      ? {
          title: tomorrowEntry.title,
          description: tomorrowEntry.description,
          date: tomorrowEntry.date,
          category: tomorrowEntry.category,
        }
      : {
          ...FALLBACK_SPECIAL_DAY,
          date: new Date(Date.now() + 86400000).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
          }),
        };
  },
};
