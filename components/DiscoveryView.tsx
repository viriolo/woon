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
    <div className="absolute top-0 left-0 right-0 pt-24 pb-12 px-4 z-10 text-center bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
            <h2 className="text-sm font-bold text-special-secondary uppercase tracking-widest">{specialDay.date}</h2>
            <h1 className="text-5xl font-display font-bold text-neutral-900 my-1" style={{textShadow: '0 2px 10px rgba(255,255,255,0.7)'}}>
                {specialDay.title}
            </h1>
            <p className="text-neutral-700 max-w-xl mx-auto">{specialDay.description}</p>
            <div className="mt-6 max-w-lg mx-auto">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search celebrations"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-full text-neutral-900 placeholder-neutral-500 shadow-lg shadow-black/5 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                        aria-label="Search celebrations"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-neutral-500" />
                    </div>
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
}> = ({ celebrations, tomorrowSpecialDay, onSelectCelebration }) => (
    <div className="absolute bottom-24 left-0 right-0 z-10 animate-slide-up">
        <div className="flex gap-3 overflow-x-auto pb-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {celebrations.map(c => {
                return (
                    <button 
                        key={c.id} 
                        onClick={() => onSelectCelebration(c.id)}
                        className="flex-shrink-0 w-48 bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden text-left transition-all duration-300 border border-white/20 shadow-lg shadow-black/5 hover:border-white/50"
                    >
                        <img src={c.imageUrl} alt={c.title} className="w-full h-24 object-cover" />
                        <div className="p-3">
                            <p className="font-bold text-sm truncate text-neutral-900">{c.title}</p>
                            <p className="text-xs text-neutral-500">by {c.author}</p>
                        </div>
                    </button>
                )
            })}
             <div className="flex-shrink-0 w-48 p-3 bg-neutral-100/50 backdrop-blur-sm border border-neutral-200/30 rounded-2xl flex flex-col justify-center">
                <p className="text-xs font-bold text-neutral-500 uppercase">Tomorrow</p>
                <h3 className="font-bold text-special-secondary">{tomorrowSpecialDay.title}</h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-3">{tomorrowSpecialDay.description}</p>
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