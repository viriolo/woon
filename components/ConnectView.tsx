import React, { useMemo, useState } from "react";
import type { User, Event } from "../types";
import { CalendarPlusIcon, UsersIcon, GlobeAltIcon, MapIcon } from "./icons";

interface ConnectViewProps {
    currentUser: User | null;
    onShowEventCreation: () => void;
    events: Event[];
    onViewEvent: (event: Event) => void;
}

const SCOPES = ["Local", "Regional", "National", "Global", "Business"] as const;
type Scope = typeof SCOPES[number];

const curatedSpotlights: Record<Exclude<Scope, "Local">, Array<{ title: string; status: string; participants: number; region: string; focus: string; accent: string }>> = {
    Regional: [
        {
            title: "Pacific Northwest Maker Crawl",
            status: "Live now",
            participants: 8421,
            region: "Seattle + Portland",
            focus: "Street murals, pop-up jam sessions",
            accent: "bg-sky-100 text-sky-700",
        },
        {
            title: "Great Lakes Creativity Circuit",
            status: "This weekend",
            participants: 6310,
            region: "Chicago, Detroit, Toronto",
            focus: "Floating lanterns & river projections",
            accent: "bg-cyan-100 text-cyan-700",
        },
    ],
    National: [
        {
            title: "Nationwide Night of Light",
            status: "Announced",
            participants: 18842,
            region: "Across the U.S.",
            focus: "Neighborhood lightshows & story swaps",
            accent: "bg-violet-100 text-violet-700",
        },
        {
            title: "Community Canvas Week",
            status: "Applications open",
            participants: 12980,
            region: "48 states confirmed",
            focus: "Collaborative murals & maker fairs",
            accent: "bg-rose-100 text-rose-700",
        },
    ],
    Global: [
        {
            title: "World Environment Day",
            status: "Live now",
            participants: 45623,
            region: "Global",
            focus: "Tree planting, cleanups, maker sessions",
            accent: "bg-emerald-100 text-emerald-700",
        },
        {
            title: "International Yoga Day",
            status: "Starting soon",
            participants: 23891,
            region: "India + 89 countries",
            focus: "Mass sunrise flows & park sessions",
            accent: "bg-amber-100 text-amber-700",
        },
    ],
    Business: [
        {
            title: "Downtown Creative Showcase",
            status: "Partner highlight",
            participants: 3120,
            region: "Multiple city centers",
            focus: "Local artisans + small business pop-ups",
            accent: "bg-fuchsia-100 text-fuchsia-700",
        },
        {
            title: "Retail Glow Tours",
            status: "Planning",
            participants: 2895,
            region: "Major hubs",
            focus: "Night markets with immersive installations",
            accent: "bg-lime-100 text-lime-700",
        },
    ],
};

const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCv4OVG-ePHcSmTNELsFXzHwaJa_lbuJEFPj9fXdtrcdmeIvCS7ChAkPifMxUnGvNsPmU2S7l-np9YNq2D_qz-Ll5icK-CWr3qjM2Z7r4q8pgRULKd1Aa_qP4dYgdjw60uOag0JJymI5kER_8YA6fSRhvNZxQDwXtoQUGynyWdMyw32bLonbVZVFK3f6hVp06SoX3p3u1ne4UwieQi_x7w2uSddidNiVx8nqDl_Kp3Y9HrUAKAHT619UJLQqEcEuL8x1kvhthgWtSx8";

const StatCard: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
    <div className="surface-card surface-card--tight px-5 py-5 text-center">
        <p className="section-heading">{label}</p>
        <p className="text-heading text-2xl">{value}</p>
    </div>
);

const HappeningCard: React.FC<{ celebration: typeof globalCelebrations[number] }> = ({ celebration }) => (
    <article className="surface-card surface-card--tight min-w-[16rem] px-5 py-5">
        <div className="flex items-center justify-between">
            <h3 className="text-heading">{celebration.title}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${celebration.accent}`}>{celebration.status}</span>
        </div>
        <div className="mt-3 space-y-2 text-sm text-ink-600">
            <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                <span>{celebration.participants.toLocaleString()} joining</span>
            </div>
            <div className="flex items-center gap-2">
                <GlobeAltIcon className="h-4 w-4" />
                <span>{celebration.region}</span>
            </div>
            <p>{celebration.focus}</p>
        </div>
    </article>
);

const LocalEventCard: React.FC<{ event: Event; onView: () => void }> = ({ event, onView }) => (
    <button
        type="button"
        onClick={onView}
        className="surface-card surface-card--tight w-full px-5 py-5 text-left transition hover:-translate-y-1"
    >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span>{event.date}</span>
            <span>{event.time}</span>
        </div>
        <h3 className="mt-3 text-heading text-xl">{event.title}</h3>
        <p className="mt-2 text-sm text-ink-500">{event.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-600">
            <span className="tag-chip">
                <MapIcon className="h-4 w-4" />
                {event.location}
            </span>
            <span className="tag-chip">
                <UsersIcon className="h-4 w-4" />
                {event.attendeeCount} attending
            </span>
        </div>
    </button>
);

export const ConnectView: React.FC<ConnectViewProps> = ({ currentUser, onShowEventCreation, events, onViewEvent }) => {
    const totalAttendees = useMemo(() => events.reduce((acc, event) => acc + event.attendeeCount, 0), [events]);
    const stats = [
        { label: "Celebrating neighbors", value: Math.max(events.length * 6, 12) },
        { label: "RSVPs this week", value: Math.max(totalAttendees, 48) },
        { label: "New share ideas", value: 8 },
    ];
    const [activeScope, setActiveScope] = useState<Scope>("Local");

    const spotlights = activeScope === "Local" ? [] : curatedSpotlights[activeScope];

    return (
        <div className="flex w-full flex-col gap-8 text-ink-900">
            <section className="glass-panel relative overflow-hidden px-6 py-8">
                <img src={heroImage} alt="Neighborhood" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-900/75 via-ink-900/45 to-transparent" />
                <div className="relative flex flex-col gap-6 text-white">
                    <div className="space-y-2">
                        <p className="section-heading text-white/80">Your neighborhood today</p>
                        <h1 className="text-heading text-3xl text-white">Connect & celebrate together</h1>
                        <p className="max-w-md text-sm text-white/80">
                            Track what neighbours are hosting and peek at celebrations lighting up the globe.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="tag-chip bg-white/15 text-white">
                            <UsersIcon className="h-4 w-4" /> {Math.max(events.length * 4, 12)} neighbors active today
                        </span>
                        {currentUser && (
                            <button
                                type="button"
                                onClick={onShowEventCreation}
                                className="pill-button pill-accent bg-white text-ink-900"
                            >
                                <CalendarPlusIcon className="h-5 w-5" /> Host a neighborhood event
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
                {stats.map(stat => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value} />
                ))}
            </section>

            <section className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-heading text-lg">Explore celebrations</h2>
                        <span className="section-heading">Choose a scope</span>
                    </div>
                    <div className="scroll-snap-x flex gap-3 overflow-x-auto pb-2">
                        {SCOPES.map(scope => (
                            <button
                                key={scope}
                                type="button"
                                onClick={() => setActiveScope(scope)}
                                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${activeScope === scope ? "bg-primary text-white shadow-brand" : "bg-surface-light/80 text-ink-600 hover:bg-primary/10"}`}
                            >
                                {scope}
                            </button>
                        ))}
                    </div>
                </div>

                {activeScope === "Local" ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-heading text-lg">Local gatherings</h3>
                            <span className="section-heading">{events.length || "No"} events</span>
                        </div>
                        {currentUser && (
                            <button
                                type="button"
                                onClick={onShowEventCreation}
                                className="pill-button pill-accent w-full justify-center sm:w-auto"
                            >
                                <CalendarPlusIcon className="h-5 w-5" /> Create community event
                            </button>
                        )}
                        <div className="space-y-4">
                            {events.length ? (
                                events.map(event => (
                                    <LocalEventCard key={event.id} event={event} onView={() => onViewEvent(event)} />
                                ))
                            ) : (
                                <div className="surface-card surface-card--tight px-5 py-6 text-center text-sm text-ink-500">
                                    No events yet. Be the first to create one today!
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-heading text-lg">{activeScope} celebrations</h3>
                            <span className="section-heading">Curated highlights</span>
                        </div>
                        <div className="scroll-snap-x flex gap-4 overflow-x-auto pb-2">
                            {spotlights.map(spotlight => (
                                <HappeningCard key={`${spotlight.title}-${spotlight.region}`} celebration={spotlight} />
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {activeScope === "Business" && (
                <section className="surface-card surface-card--tight px-6 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-heading text-lg">Boost your business celebrations</h3>
                            <p className="mt-1 text-sm text-ink-500">Spin up limited offers and track engagement in the business dashboard.</p>
                        </div>
                        <button type="button" className="pill-button pill-accent">
                            <CalendarPlusIcon className="h-5 w-5" /> Explore partnerships
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
};
