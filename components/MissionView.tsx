import React from "react";
import { XCircleIcon, SparklesIcon, ConnectIcon, AddCircleIcon } from "./icons";

interface MissionViewProps {
    onClose: () => void;
}

const MissionPoint: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1 flex-shrink-0 text-primary">{icon}</div>
        <div>
            <h3 className="text-heading text-base">{title}</h3>
            <p className="text-sm text-ink-600">{description}</p>
        </div>
    </div>
);

export const MissionView: React.FC<MissionViewProps> = ({ onClose }) => {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-surface max-w-xl space-y-6" onClick={event => event.stopPropagation()}>
                <button onClick={onClose} className="absolute right-6 top-6 text-ink-400 transition hover:text-ink-600" aria-label="Close mission view">
                    <XCircleIcon className="h-7 w-7" />
                </button>

                <header className="space-y-2 pr-10">
                    <span className="section-heading text-ink-400">Our mission</span>
                    <h2 className="text-heading text-2xl">Why Woon exists</h2>
                    <p className="text-sm text-ink-500">We believe every day holds a reason to celebrate.</p>
                </header>

                <div className="space-y-5 text-sm text-ink-600">
                    <p>
                        Woon was born from a simple idea: bring more joy, creativity, and connection into everyday moments. We help you spot the delightful themes hiding in each date and turn them into shared experiences.
                    </p>

                    <div className="space-y-4">
                        <MissionPoint
                            icon={<SparklesIcon className="h-6 w-6" />}
                            title="Discover daily wonders"
                            description="We spotlight each day's theme—from World Creativity Day to National Donut Day—so you never miss a reason to smile."
                        />
                        <MissionPoint
                            icon={<AddCircleIcon className="h-6 w-6" />}
                            title="Inspire creativity"
                            description="Use our tools, like the AI idea generator, to bring celebrations to life and share how you're marking the moment."
                        />
                        <MissionPoint
                            icon={<ConnectIcon className="h-6 w-6" />}
                            title="Connect communities"
                            description="Find or host neighborhood events, meet new friends, and turn personal celebrations into shared memories."
                        />
                    </div>

                    <p className="rounded-2xl bg-accent-soft px-5 py-4 text-center text-sm font-semibold text-primary">
                        Join us in making every day a special day.
                    </p>
                </div>
            </div>
        </div>
    );
};
