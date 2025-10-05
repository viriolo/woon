import React, { useMemo, useState } from "react";
import type { Event, UserLocation } from "../../../types";
import type { AuthUser } from "../../services/authService";
import { eventService } from "../../../services/eventService";
import { haversineDistanceKm } from "../../utils/geo";

interface ConnectViewProps {
  events: Event[];
  loading: boolean;
  location: UserLocation | null;
  currentUser: AuthUser | null;
  requireAuth: (message: string, action?: () => void) => boolean;
  onEventCreated: (event: Event) => void;
  onToggleRsvp: (eventId: string) => Promise<void>;
}

type ScopeKey = "local" | "regional" | "national" | "global";

const SCOPE_CONFIG: Record<ScopeKey, { label: string; radiusKm: number | null }> = {
  local: { label: "Local", radiusKm: 50 },
  regional: { label: "Regional", radiusKm: 300 },
  national: { label: "National", radiusKm: 1500 },
  global: { label: "Global", radiusKm: null },
};

const getCountdownLabel = (event: Event): string => {
  const eventDateTime = new Date(`${event.date}T${event.time || "00:00"}`);
  const diffMs = eventDateTime.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Happening now";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `${diffDays} days away`;
};

const downloadIcs = (event: Event) => {
  const start = new Date(`${event.date}T${event.time || "09:00"}`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Woon//Celebration Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@woon.app`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(start)}`,
    `DTEND:${format(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.title.replace(/\s+/g, "-")}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const ConnectView: React.FC<ConnectViewProps> = ({
  events,
  loading,
  location,
  currentUser,
  requireAuth,
  onEventCreated,
  onToggleRsvp,
}) => {
  const [scope, setScope] = useState<ScopeKey>("local");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreation, setShowCreation] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    time: "18:00",
    location: "",
  });

  const filteredEvents = useMemo(() => {
    if (!location) {
      return events;
    }

    const radius = SCOPE_CONFIG[scope].radiusKm;
    if (radius === null) {
      return events;
    }

    return events.filter((event) => {
      const distance = haversineDistanceKm(location, event.locationCoords);
      return distance <= radius;
    });
  }, [events, location, scope]);

  const handleCreateEvent = async () => {
    if (!currentUser) {
      requireAuth("Sign in to host an event");
      return;
    }

    if (!formState.title.trim() || !formState.location.trim()) {
      setCreationError("Title and location are required.");
      return;
    }

    const run = async () => {
      try {
        setCreating(true);
        setCreationError(null);
        const newEvent = await eventService.createEvent(
          {
            title: formState.title.trim(),
            description: formState.description.trim(),
            date: formState.date,
            time: formState.time,
            location: formState.location.trim(),
          },
          currentUser,
          location ?? undefined
        );

        onEventCreated(newEvent);
        setShowCreation(false);
        setFormState({
          title: "",
          description: "",
          date: new Date().toISOString().slice(0, 10),
          time: "18:00",
          location: "",
        });
      } catch (error: any) {
        console.error("Event creation failed", error);
        setCreationError(error?.message || "Unable to create event. Try again later.");
      } finally {
        setCreating(false);
      }
    };

    if (!requireAuth("Sign in to host an event", () => { void run(); })) {
      return;
    }

    await run();
  };

  const selectedEvent = filteredEvents.find((event) => event.id === selectedEventId) ?? null;

  return (
    <div className="connect-view">
      <header className="connect-view__header">
        <h2>Connect through events</h2>
        <p>Discover gatherings celebrating today's theme—or host your own.</p>
        <button type="button" className="btn btn-primary" onClick={() => {
          if (!currentUser) {
            requireAuth("Sign in to host an event");
            return;
          }
          setShowCreation(true);
        }}>
          + Create event
        </button>
      </header>

      <div className="connect-view__scopes" role="tablist">
        {Object.entries(SCOPE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            type="button"
            className={`connect-scope${scope === key ? " connect-scope--active" : ""}`}
            onClick={() => setScope(key as ScopeKey)}
            role="tab"
            aria-selected={scope === key}
          >
            {config.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading events…</p>
      ) : filteredEvents.length === 0 ? (
        <p>No events yet for this scope. Be the first to host!</p>
      ) : (
        <ul className="connect-view__list">
          {filteredEvents.map((event) => {
            const distance = location ? haversineDistanceKm(location, event.locationCoords) : null;
            const isSelected = selectedEventId === event.id;
            return (
              <li key={event.id} className={`connect-event${isSelected ? " connect-event--selected" : ""}`}>
                <button type="button" className="connect-event__summary" onClick={() => setSelectedEventId(isSelected ? null : event.id)}>
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.location}</p>
                  </div>
                  <div className="connect-event__meta">
                    <span>{event.date}</span>
                    <span>{getCountdownLabel(event)}</span>
                    {distance !== null && <span>{distance.toFixed(1)} km away</span>}
                  </div>
                </button>

                {isSelected && (
                  <div className="connect-event__details">
                    <p>{event.description}</p>
                    <p>Hosted by {event.authorName}</p>
                    <p>{event.attendeeCount} attending</p>
                    <div className="connect-event__actions">
                      <button type="button" className="btn" onClick={() => onToggleRsvp(event.id)}>
                        RSVP
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => downloadIcs(event)}>
                        Add to calendar
                      </button>
                      <button
                        type="button"
                        className="btn btn-tertiary"
                        onClick={async () => {
                          if (!requireAuth("Sign in to share events")) return;
                          if (navigator.share) {
                            await navigator.share({
                              title: event.title,
                              text: event.description,
                              url: window.location.href + `#event-${event.id}`,
                            });
                          }
                        }}
                      >
                        Share event
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showCreation && (
        <div className="connect-creation">
          <div className="connect-creation__card">
            <h3>Host a celebration</h3>
            <label>
              <span>Title</span>
              <input
                type="text"
                value={formState.title}
                maxLength={80}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={formState.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Time</span>
              <input
                type="time"
                value={formState.time}
                onChange={(event) => setFormState((prev) => ({ ...prev, time: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Location</span>
              <input
                type="text"
                value={formState.location}
                onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="Address or place name"
                required
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                rows={3}
                value={formState.description}
                maxLength={1000}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="What should people expect?"
              />
            </label>

            {creationError && <p className="connect-creation__error">{creationError}</p>}

            <div className="connect-creation__actions">
              <button type="button" className="btn btn-tertiary" onClick={() => setShowCreation(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreateEvent} disabled={creating}>
                {creating ? "Creating…" : "Create event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
