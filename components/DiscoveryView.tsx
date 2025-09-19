import React, { useState, useCallback, useEffect } from 'react';
import type { SpecialDay, Celebration } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { SearchIcon } from './icons';
import { BottomSheet } from './BottomSheet';

interface DiscoveryViewProps {
    specialDay: SpecialDay;
    tomorrowSpecialDay: SpecialDay;
    celebrations: Celebration[];
}

const SpecialDayBadge: React.FC<{ specialDay: SpecialDay }> = ({ specialDay }) => (
    <div className="inline-block bg-white/70 backdrop-blur-md border border-neutral-200/50 rounded-full px-4 py-2 shadow-md">
        <span className="font-bold text-neutral-800">{specialDay.title}</span>
        <span className="mx-2 text-neutral-400">•</span>
        <span className="font-medium text-special-secondary">{specialDay.date}</span>
    </div>
);


const HeroSection: React.FC<{
    specialDay: SpecialDay;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}> = ({ specialDay, searchQuery, onSearchChange }) => (
    <div className="absolute top-0 left-0 right-0 pt-16 pb-4 px-4 z-10 text-center pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center gap-4">
            <SpecialDayBadge specialDay={specialDay} />
            <div className="w-full max-w-md mx-auto relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                    type="text"
                    placeholder="Search celebrations by title or author..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/90 border border-neutral-200/50 rounded-full shadow-md placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                />
            </div>
        </div>
    </div>
);

const CelebrationCard: React.FC<{
    celebration: Celebration;
    isSelected: boolean;
    onClick: () => void;
}> = ({ celebration, isSelected, onClick }) => (
    <div
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 cursor-pointer ${
            isSelected ? 'bg-white shadow-lg scale-[1.02]' : 'bg-white/70 hover:bg-white'
        }`}
    >
        <img src={celebration.imageUrl} alt={celebration.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
        <div className="flex-grow overflow-hidden">
            <h3 className="font-bold text-neutral-800 truncate">{celebration.title}</h3>
            <p className="text-sm text-neutral-600">by {celebration.author}</p>
        </div>
    </div>
);

const TomorrowCard: React.FC<{ tomorrowSpecialDay: SpecialDay }> = ({ tomorrowSpecialDay }) => (
    <div className="w-full rounded-xl p-4 bg-neutral-800 text-white">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">TOMORROW</h3>
        <p className="text-lg font-bold text-white">{tomorrowSpecialDay.title}</p>
        <p className="text-sm opacity-80 mt-1">{tomorrowSpecialDay.description}</p>
    </div>
);

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ specialDay, tomorrowSpecialDay, celebrations }) => {
    const [selectedCelebrationId, setSelectedCelebrationId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectCelebration = useCallback((id: number) => {
        setSelectedCelebrationId(prevId => prevId === id ? null : id);
    }, []);
    
    useEffect(() => {
        if (selectedCelebrationId && !searchQuery) return;
        const isSelectedVisible = celebrations.some(c => c.id === selectedCelebrationId && 
            (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             c.author.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if(!isSelectedVisible) {
            setSelectedCelebrationId(null);
        }
    }, [searchQuery, selectedCelebrationId, celebrations]);

    const filteredCelebrations = celebrations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full w-full relative">
            <InteractiveMap
                celebrations={filteredCelebrations}
                selectedCelebrationId={selectedCelebrationId}
                onSelectCelebration={handleSelectCelebration}
            />
            <HeroSection
                specialDay={specialDay}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <BottomSheet>
                <div className="space-y-3">
                    {filteredCelebrations.map(c => (
                        <CelebrationCard
                            key={c.id}
                            celebration={c}
                            isSelected={selectedCelebrationId === c.id}
                            onClick={() => handleSelectCelebration(c.id)}
                        />
                    ))}
                    <TomorrowCard tomorrowSpecialDay={tomorrowSpecialDay} />
                </div>
            </BottomSheet>
        </div>
    );
};