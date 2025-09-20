

import React, { useState, useCallback, useEffect } from 'react';
import type { SpecialDay, Celebration, User } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { CelebrationDetailView } from './CelebrationDetailView';
import { SearchIcon, HeartIcon, ChatBubbleLeftIcon } from './icons';
import { BottomSheet } from './BottomSheet';

interface DiscoveryViewProps {
    specialDay: SpecialDay;
    tomorrowSpecialDay: SpecialDay;
    celebrations: Celebration[];
    currentUser: User | null;
    onToggleLike: (celebrationId: number) => void;
    onToggleSave: (celebrationId: number) => void;
}

const SpecialDayBadge: React.FC<{ specialDay: SpecialDay }> = ({ specialDay }) => (
    <div className="inline-block bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-md">
        <span className="font-bold text-neutral-800">{specialDay.title}</span>
        <span className="mx-2 text-neutral-400">•</span>
        <span className="font-medium text-special-primary">{specialDay.date}</span>
    </div>
);

const FloatingHeader: React.FC<{
    specialDay: SpecialDay;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}> = ({ specialDay, searchQuery, onSearchChange }) => (
    <div className="absolute top-4 left-0 right-0 px-4 z-10 flex flex-col items-center gap-3 pointer-events-none">
        <div className="pointer-events-auto">
            <SpecialDayBadge specialDay={specialDay} />
        </div>
        <div className="w-full max-w-md mx-auto relative pointer-events-auto">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
                type="text"
                placeholder="Search celebrations..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-md border border-neutral-200/50 rounded-full shadow-md placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
            />
        </div>
    </div>
);


const CelebrationCard: React.FC<{
    celebration: Celebration;
    onClick: () => void;
}> = ({ celebration, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 bg-white/70 hover:bg-white hover:shadow-lg hover:scale-[1.02]"
    >
        <img src={celebration.imageUrl} alt={celebration.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
        <div className="flex-grow overflow-hidden text-left">
            <h3 className="font-bold text-neutral-800 truncate">{celebration.title}</h3>
            <p className="text-sm text-neutral-600">by {celebration.author}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-4 text-sm text-neutral-600">
             <div className="flex items-center gap-1">
                <HeartIcon className="w-5 h-5 text-neutral-400" />
                <span>{celebration.likes}</span>
            </div>
             <div className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-5 h-5 text-neutral-400" />
                <span>{celebration.commentCount}</span>
            </div>
        </div>
    </button>
);

const TomorrowCard: React.FC<{ tomorrowSpecialDay: SpecialDay }> = ({ tomorrowSpecialDay }) => (
    <div className="w-full rounded-xl p-4 bg-neutral-800 text-white">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">TOMORROW</h3>
        <p className="text-lg font-bold text-white">{tomorrowSpecialDay.title}</p>
        <p className="text-sm opacity-80 mt-1">{tomorrowSpecialDay.description}</p>
    </div>
);

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ specialDay, tomorrowSpecialDay, celebrations, currentUser, onToggleLike, onToggleSave }) => {
    const [selectedCelebration, setSelectedCelebration] = useState<Celebration | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectCelebration = useCallback((celebration: Celebration | null) => {
        setSelectedCelebration(celebration);
    }, []);
    
    useEffect(() => {
        if (selectedCelebration && !searchQuery) return;
        const isSelectedVisible = celebrations.some(c => c.id === selectedCelebration?.id && 
            (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             c.author.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if(!isSelectedVisible) {
            setSelectedCelebration(null);
        }
    }, [searchQuery, selectedCelebration, celebrations]);

    const filteredCelebrations = celebrations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCommentAdded = (celebrationId: number) => {
        // This is a bit of a hack to force a re-render with the new comment count
        const celebration = celebrations.find(c => c.id === celebrationId);
        if (celebration) {
            celebration.commentCount += 1;
            setSelectedCelebration({ ...celebration });
        }
    };

    const handleSheetStateChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedCelebration(null);
        }
    };

    return (
        <div className="h-full w-full relative">
            <InteractiveMap
                celebrations={filteredCelebrations}
                selectedCelebrationId={selectedCelebration?.id ?? null}
                onSelectCelebration={(id) => handleSelectCelebration(id ? filteredCelebrations.find(c => c.id === id) ?? null : null)}
            />
            <FloatingHeader
                specialDay={specialDay}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <BottomSheet isOpen={!!selectedCelebration} onStateChange={handleSheetStateChange}>
                {selectedCelebration ? (
                    <CelebrationDetailView 
                        celebration={selectedCelebration}
                        currentUser={currentUser}
                        onBack={() => handleSelectCelebration(null)}
                        onToggleLike={onToggleLike}
                        onToggleSave={onToggleSave}
                        onCommentAdded={handleCommentAdded}
                    />
                ) : (
                    <div className="space-y-3">
                        {filteredCelebrations.map(c => (
                            <CelebrationCard
                                key={c.id}
                                celebration={c}
                                onClick={() => handleSelectCelebration(c)}
                            />
                        ))}
                        <TomorrowCard tomorrowSpecialDay={tomorrowSpecialDay} />
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};
