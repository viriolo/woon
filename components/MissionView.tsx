
import React from 'react';
import { XCircleIcon, SparklesIcon, ConnectIcon, AddCircleIcon } from './icons';

interface MissionViewProps {
    onClose: () => void;
}

export const MissionView: React.FC<MissionViewProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div
                className="relative w-full max-w-lg m-4 bg-neutral-100 border border-neutral-200 rounded-2xl shadow-2xl p-6 animate-slide-up max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-special-primary">
                            Our Mission
                        </h2>
                        <p className="text-sm text-neutral-500">Why Woon exists.</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 transition-colors" aria-label="Close mission view">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </header>

                <div className="overflow-y-auto space-y-6 pr-2 -mr-2 text-neutral-700">
                    <p className="font-medium text-lg">
                        We believe every day holds a reason to celebrate.
                    </p>
                    <p>
                        Woon was born from a simple idea: to bring a little more joy, creativity, and connection into our daily lives. In a world that moves so fast, it's easy to overlook the small wonders and unique moments each day offers. Our mission is to change that.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex-shrink-0 text-special-secondary">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-800">Discover Daily Wonders</h3>
                                <p>We uncover the special theme for every single day of the year—from World Creativity Day to National Donut Day. Woon is your daily guide to these fun, quirky, and meaningful observances.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex-shrink-0 text-special-secondary">
                                <AddCircleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-800">Inspire Creativity</h3>
                                <p>Knowing the day's theme is just the start. Woon provides tools and inspiration, like our AI idea generator, to help you bring your celebrations to life. Share your creations and see how others are marking the occasion.</p>
                            </div>
                        </div>

                         <div className="flex items-start gap-4">
                            <div className="mt-1 flex-shrink-0 text-special-secondary">
                                <ConnectIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-800">Connect Communities</h3>
                                <p>Celebrations are better together. Woon helps you find and create local events, connecting you with neighbors who share your passion for joy and community. It's about turning individual celebrations into shared memories.</p>
                            </div>
                        </div>
                    </div>
                    
                    <p className="pt-4 border-t border-neutral-200 font-semibold text-center text-special-primary">
                        Join us in making every day a special day.
                    </p>
                </div>
            </div>
        </div>
    );
};
