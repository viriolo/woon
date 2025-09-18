
import React from 'react';
import type { SpecialDay, Celebration } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface DiscoveryViewProps {
    specialDay: SpecialDay;
    tomorrowSpecialDay: SpecialDay;
    celebrations: Celebration[];
}

const HeroSection: React.FC<{ specialDay: SpecialDay }> = ({ specialDay }) => (
    <div className="absolute top-0 left-0 right-0 pt-20 pb-10 px-4 z-10 text-center bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-transparent">
        <h2 className="text-sm font-medium text-special-secondary uppercase tracking-widest">{specialDay.date}</h2>
        <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-special-surface to-special-secondary my-1">
            {specialDay.title}
        </h1>
        <p className="text-neutral-300 max-w-xl mx-auto">{specialDay.description}</p>
    </div>
);

const TomorrowPreview: React.FC<{ tomorrowSpecialDay: SpecialDay }> = ({ tomorrowSpecialDay }) => (
    <div className="absolute bottom-24 left-4 right-4 z-10 p-4 rounded-xl bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 animate-slide-up">
        <p className="text-xs font-bold text-neutral-500 uppercase">Tomorrow</p>
        <h3 className="font-bold text-special-secondary">{tomorrowSpecialDay.title}</h3>
    </div>
);

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ specialDay, tomorrowSpecialDay, celebrations }) => {
    return (
        <div className="h-full w-full animate-fade-in">
            <HeroSection specialDay={specialDay} />
            <InteractiveMap celebrations={celebrations} />
            <TomorrowPreview tomorrowSpecialDay={tomorrowSpecialDay} />
        </div>
    );
};
