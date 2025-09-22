import React, { useMemo } from "react";
import type { User, Event } from "../types";
import { CalendarPlusIcon, UsersIcon, GlobeAltIcon, MapIcon } from "./icons";

interface ConnectViewProps {
    currentUser: User | null;
    onShowEventCreation: () => void;
    events: Event[];
    onViewEvent: (event: Event) => void;
}

const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCv4OVG-ePHcSmTNELsFXzHwaJa_lbuJEFPj9fXdtrcdmeIvCS7ChAkPifMxUnGvNsPmU2S7l-np9YNq2D_qz-Ll5icK-CWr3qjM2Z7r4q8pgRULKd1Aa_qP4dYgdjw60uOag0JJymI5kER_8YA6fSRhvNZxQDwXtoQUGynyWdMyw32bLonbVZVFK3f6hVp06SoX3p3u1ne4UwieQi_x7w2uSddidNiVx8nqDl_Kp3Y9HrUAKAHT619UJLQqEcEuL8x1kvhthgWtSx8";

const globalCelebrations = [
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
];

const HappeningCard: React.FC<{ celebration: typeof globalCelebrations[number] }> = ({ celebration }) => (
    <article className="min-w-[16rem] rounded-3xl bg-surface-light px-5 py-5 shadow-brand ring-1 ring-white/60">
        <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink-900">{celebration.title}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${celebration.accent}`}>{celebration.status}</span>
        </div>
        <div className="mt-3 space-y-2 text-sm text-ink-500">
            <div className="flex items-center gap-2 text-ink-600">
                <UsersIcon className="h-4 w-4" />
                <span>{celebration.participants.toLocaleString()} joining</span>
            </div>
            <div className="flex items-center gap-2 text-ink-600">
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
        className="w-full rounded-3xl bg-white px-5 py-5 text-left shadow-brand ring-1 ring-white/60 transition hover:-translate-y-1"
    >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span>{event.date}</span>
            <span>{event.time}</span>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-ink-900">{event.title}</h3>
        <p className="mt-2 text-sm text-ink-500">{event.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-light px-3 py-1">
                <MapIcon className="h-4 w-4" />
                {event.location}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-light px-3 py-1">
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

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light text-ink-900">
            <header className="relative h-60 overflow-hidden rounded-b-[2.5rem] shadow-brand">
                <img src={heroImage} alt="Neighborhood" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Your neighborhood today</p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                        <div className="space-y-1 text-white">
                            <h1 className="text-2xl font-semibold">Connect & celebrate together</h1>
                            <p className="text-sm text-white/80">Track what\'s happening nearby and around the world.</p>
                        </div>
                        {currentUser && (
                            <button
                                type="button"
                                onClick={onShowEventCreation}
                                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-900 shadow-lg transition hover:-translate-y-0.5"
                            >
                                <CalendarPlusIcon className="h-5 w-5" />
                                Host a neighborhood event
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 space-y-8 overflow-y-auto px-5 pb-32 pt-6">
                <section className="grid gap-3 sm:grid-cols-3">
                    {stats.map(stat => (
                        <div key={stat.label} className="rounded-3xl bg-surface-light px-5 py-5 shadow-brand ring-1 ring-white/60">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-400">{stat.label}</p>
                            <p className="mt-2 text-2xl font-semibold text-ink-900">{stat.value}</p>
                        </div>
                    ))}
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-ink-900">Happening now</h2>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-400">Global spotlight</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {globalCelebrations.map(celebration => (
                            <HappeningCard key={celebration.title} celebration={celebration} />
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-ink-900">Local gatherings</h2>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-400">{events.length || "No"} events</span>
                    </div>
                    <div className="space-y-4">
                        {events.length ? (
                            events.map(event => (
                                <LocalEventCard key={event.id} event={event} onView={() => onViewEvent(event)} />
                            ))
                        ) : (
                            <div className="rounded-3xl bg-surface-light px-5 py-6 text-center text-sm text-ink-500 shadow-brand ring-1 ring-white/60">
                                No events yet. Be the first to create one today!
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-3xl bg-surface-light px-6 py-6 shadow-brand ring-1 ring-white/60">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-ink-900">Boost your business celebrations</h3>
                            <p className="mt-1 text-sm text-ink-500">Spin up limited offers and see live engagement in the business dashboard.</p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
                        >
                            <CalendarPlusIcon className="h-5 w-5" />
                            Explore partnerships
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

