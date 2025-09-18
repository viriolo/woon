
import React, { useState, useCallback, useEffect } from 'react';
import type { SpecialDay, Celebration } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { SearchIcon } from './icons';

interface DiscoveryViewProps {
    specialDay: SpecialDay;
    tomorrowSpecialDay: SpecialDay;
    celebrations: Celebration[];
}

const HeroSection: React.FC<{
    specialDay: SpecialDay;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}> = ({ specialDay, searchQuery, onSearchChange }) => (
    <div className="absolute top-0 left-0 right-0 pt-20 pb-10 px-4 z-10 text-center bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-transparent">
        <h2 className="text-sm font-medium text-special-secondary uppercase tracking-widest">{specialDay.date}</h2>
        <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-special-surface to-special-secondary my-1">
            {specialDay.title}
        </h1>
        <p className="text-neutral-300 max-w-xl mx-auto">{specialDay.description}</p>
        <div className="mt-4 max-w-lg mx-auto">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search celebrations by title or author..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-800/70 backdrop-blur-sm border border-neutral-700 rounded-full text-white placeholder-neutral-400 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                    aria-label="Search celebrations"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-neutral-400" />
                </div>
            </div>
        </div>
    </div>
);

const CelebrationCarousel: React.FC<{
    celebrations: Celebration[];
    tomorrowSpecialDay: SpecialDay;
    selectedCelebrationId: number | null;
    onSelectCelebration: (id: number | null) => void;
}> = ({ celebrations, tomorrowSpecialDay, selectedCelebrationId, onSelectCelebration }) => (
    <div className="absolute bottom-24 left-0 right-0 z-10 animate-slide-up">
        <div className="flex gap-4 overflow-x-auto pb-4 px-4">
            {celebrations.map(c => {
                const isSelected = c.id === selectedCelebrationId;
                return (
                    <button 
                        key={c.id} 
                        onClick={() => onSelectCelebration(c.id)}
                        className={`flex-shrink-0 w-52 bg-neutral-800/70 backdrop-blur-md rounded-lg overflow-hidden text-left transition-all duration-300 ring-special-primary ${isSelected ? 'ring-2' : 'ring-0 hover:ring-2'}`}
                    >
                        <img src={c.imageUrl} alt={c.title} className="w-full h-24 object-cover" />
                        <div className="p-3">
                            <p className="font-bold text-sm truncate text-neutral-100">{c.title}</p>
                            <p className="text-xs text-neutral-400">by {c.author}</p>
                        </div>
                    </button>
                )
            })}
             <div className="flex-shrink-0 w-52 p-3 bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-lg">
                <p className="text-xs font-bold text-neutral-500 uppercase">Tomorrow</p>
                <h3 className="font-bold text-special-secondary">{tomorrowSpecialDay.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-3">{tomorrowSpecialDay.description}</p>
            </div>
        </div>
    </div>
);


export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ specialDay, tomorrowSpecialDay, celebrations }) => {
    const [selectedCelebrationId, setSelectedCelebrationId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCelebrations = celebrations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        // If the selected celebration is filtered out, deselect it
        if (selectedCelebrationId && !filteredCelebrations.some(c => c.id === selectedCelebrationId)) {
            setSelectedCelebrationId(null);
        }
    }, [filteredCelebrations, selectedCelebrationId]);


    const handleSelectCelebration = useCallback((id: number | null) => {
        setSelectedCelebrationId(id);
    }, []);

    return (
        <div className="h-full w-full animate-fade-in">
            <HeroSection 
                specialDay={specialDay} 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <InteractiveMap 
                celebrations={filteredCelebrations} 
                selectedCelebrationId={selectedCelebrationId}
                onSelectCelebration={handleSelectCelebration}
            />
            <CelebrationCarousel 
                celebrations={filteredCelebrations} 
                tomorrowSpecialDay={tomorrowSpecialDay} 
                selectedCelebrationId={selectedCelebrationId}
                onSelectCelebration={handleSelectCelebration}
            />
        </div>
    );
};