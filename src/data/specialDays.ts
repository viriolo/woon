import type { SpecialDay } from "../../types";

export interface SpecialDayEntry extends SpecialDay {
  month: number;
  day: number;
  tags: string[];
  region?: "global" | "regional" | "national";
}

export const SPECIAL_DAYS: SpecialDayEntry[] = [
  {
    month: 1,
    day: 1,
    title: "New Year's Day",
    description: "Celebrate the first day of the year with gratitude, reflection, and connection.",
    date: "January 1",
    category: "Global Observance",
    tags: ["renewal", "community"],
    region: "global",
  },
  {
    month: 1,
    day: 15,
    title: "World Snow Day",
    description: "A UNESCO-backed celebration inviting families to explore winter together.",
    date: "January 15",
    category: "Seasonal",
    tags: ["outdoors", "family", "winter"],
    region: "global",
  },
  {
    month: 2,
    day: 14,
    title: "Valentine's Day",
    description: "Share love in every form—friends, partners, communities, and self-care.",
    date: "February 14",
    category: "Cultural",
    tags: ["love", "connection"],
    region: "global",
  },
  {
    month: 2,
    day: 20,
    title: "World Day of Social Justice",
    description: "UN day calling for fair societies through participation and celebration.",
    date: "February 20",
    category: "UN Observance",
    tags: ["justice", "community", "equity"],
    region: "global",
  },
  {
    month: 3,
    day: 8,
    title: "International Women's Day",
    description: "Celebrate achievements, creativity, and the joy of inclusive communities.",
    date: "March 8",
    category: "UN Observance",
    tags: ["equity", "celebration"],
    region: "global",
  },
  {
    month: 3,
    day: 14,
    title: "Pi Day",
    description: "Math meets fun—organize playful events, bake pies, or run circular challenges.",
    date: "March 14",
    category: "Popular Holiday",
    tags: ["STEM", "food", "fun"],
    region: "global",
  },
  {
    month: 4,
    day: 21,
    title: "World Creativity Day",
    description: "Spark creativity in your neighbourhood with art jams, workshops, and open studios.",
    date: "April 21",
    category: "UN Observance",
    tags: ["creativity", "innovation"],
    region: "global",
  },
  {
    month: 4,
    day: 22,
    title: "Earth Day",
    description: "A planet-wide celebration of stewardship through cleanups, planting, and storytelling.",
    date: "April 22",
    category: "Environmental",
    tags: ["sustainability", "community"],
    region: "global",
  },
  {
    month: 5,
    day: 1,
    title: "International Workers' Day",
    description: "Honour the contributions of workers and organize community appreciation events.",
    date: "May 1",
    category: "Global Observance",
    tags: ["community", "solidarity"],
    region: "global",
  },
  {
    month: 5,
    day: 4,
    title: "Star Wars Day",
    description: "May the Fourth be with you—host cosplay meetups, trivia nights, or movie screenings.",
    date: "May 4",
    category: "Popular Holiday",
    tags: ["fandom", "fun"],
    region: "global",
  },
  {
    month: 6,
    day: 5,
    title: "World Environment Day",
    description: "UN-led day encouraging local action for resilient, flourishing ecosystems.",
    date: "June 5",
    category: "UN Observance",
    tags: ["sustainability", "activism"],
    region: "global",
  },
  {
    month: 6,
    day: 21,
    title: "International Yoga Day",
    description: "Communities gather for sunrise flows and mindful celebrations of well-being.",
    date: "June 21",
    category: "Wellness",
    tags: ["wellness", "community"],
    region: "global",
  },
  {
    month: 7,
    day: 1,
    title: "Canada Day",
    description: "Nation-wide celebrations with fireworks, concerts, and community picnics.",
    date: "July 1",
    category: "National Holiday",
    tags: ["parades", "music"],
    region: "national",
  },
  {
    month: 7,
    day: 30,
    title: "International Day of Friendship",
    description: "Celebrate bonds that bridge cultures with potlucks, story circles, and art exchanges.",
    date: "July 30",
    category: "UN Observance",
    tags: ["friendship", "connection"],
    region: "global",
  },
  {
    month: 8,
    day: 12,
    title: "International Youth Day",
    description: "Elevate youth-led ideas through showcases, hackathons, and block parties.",
    date: "August 12",
    category: "UN Observance",
    tags: ["youth", "innovation"],
    region: "global",
  },
  {
    month: 9,
    day: 21,
    title: "International Day of Peace",
    description: "Create peace gardens, meditation circles, or unity concerts in your city.",
    date: "September 21",
    category: "UN Observance",
    tags: ["peace", "community"],
    region: "global",
  },
  {
    month: 10,
    day: 31,
    title: "Halloween",
    description: "Transform neighbourhoods with costumes, creative treats, and spooky story swaps.",
    date: "October 31",
    category: "Popular Holiday",
    tags: ["costumes", "family", "fun"],
    region: "global",
  },
  {
    month: 11,
    day: 1,
    title: "Day of the Dead",
    description: "Pay tribute through altars, marigolds, and shared meals honouring loved ones.",
    date: "November 1",
    category: "Cultural",
    tags: ["ancestry", "tradition"],
    region: "regional",
  },
  {
    month: 11,
    day: 13,
    title: "World Kindness Day",
    description: "Celebrate kindness with surprise notes, volunteer meetups, and gratitude walls.",
    date: "November 13",
    category: "Global Observance",
    tags: ["kindness", "community"],
    region: "global",
  },
  {
    month: 12,
    day: 10,
    title: "Human Rights Day",
    description: "Host dialogues, art installations, and vigils dedicated to human dignity.",
    date: "December 10",
    category: "UN Observance",
    tags: ["justice", "equity"],
    region: "global",
  },
  {
    month: 12,
    day: 21,
    title: "Winter Solstice",
    description: "Welcome the return of light with lantern walks, fireside storytelling, and music.",
    date: "December 21",
    category: "Seasonal",
    tags: ["seasonal", "ritual"],
    region: "global",
  },
];

export const getSpecialDayForDate = (date: Date): SpecialDayEntry | null => {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return (
    SPECIAL_DAYS.find((entry) => entry.month === month && entry.day === day) || null
  );
};

export const getUpcomingSpecialDay = (offsetDays: number): SpecialDayEntry | null => {
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + offsetDays);
  return getSpecialDayForDate(target);
};
