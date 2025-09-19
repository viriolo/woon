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
            <p className="text-