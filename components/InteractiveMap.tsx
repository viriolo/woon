import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Celebration } from '../types';
import { USER_LOCATION, MAPBOX_ACCESS_TOKEN } from '../constants';

interface InteractiveMapProps {
    celebrations: Celebration[];
    selectedCelebrationId: number | null;
    onSelectCelebration: (id: number | null) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ celebrations, selectedCelebrationId, onSelectCelebration }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [id: number]: { marker: mapboxgl.Marker, element: HTMLDivElement } }>({});
    
    // Initialize map
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            accessToken: MAPBOX_ACCESS_TOKEN,
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [USER_LOCATION.lng, USER_LOCATION.lat],
            zoom: 12,
            pitch: 30,
            antialias: true,
        });
        
        const currentMap = map.current;

        currentMap.on('load', () => {
            const userEl = document.createElement('div');
            userEl.className = 'w-4 h-4 rounded-full bg-blue-500 border-2 border-white relative shadow-md';
            const userPulse = document.createElement('div');
            userPulse.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-500/50 animate-ping-slow';
            userEl.appendChild(userPulse);

            new mapboxgl.Marker(userEl)
                .setLngLat([USER_LOCATION.lng, USER_LOCATION.lat])
                .addTo(currentMap);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Sync markers with celebrations data
    useEffect(() => {
        if (!map.current) return;
        const currentMap = map.current;

        const currentMarkerIds = Object.keys(markersRef.current).map(Number);
        const newCelebrationIds = celebrations.map(c => c.id);

        currentMarkerIds.forEach(id => {
            if (!newCelebrationIds.includes(id)) {
                markersRef.current[id].marker.remove();
                delete markersRef.current[id];
            }
        });

        celebrations.forEach(celebration => {
            if (!markersRef.current[celebration.id]) {
                const el = document.createElement('div');
                el.className = 'celebration-marker';

                const marker = new mapboxgl.Marker(el)
                    .setLngLat([celebration.position.lng, celebration.position.lat])
                    .addTo(currentMap);
                
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onSelectCelebration(celebration.id);
                });
                
                markersRef.current[celebration.id] = { marker, element: el };
            }
        });
    }, [celebrations, onSelectCelebration]);

    // Handle selection: fly to marker
    useEffect(() => {
        if (!selectedCelebrationId || !map.current) return;
        
        const selectedCelebration = celebrations.find(c => c.id === selectedCelebrationId);
        if (!selectedCelebration) return;

        map.current.flyTo({
            center: [selectedCelebration.position.lng, selectedCelebration.position.lat],
            zoom: 14,
            pitch: 45,
            duration: 2000,
            essential: true
        });

    }, [selectedCelebrationId, celebrations, onSelectCelebration]);

    return (
        <>
            <style>{`
                .celebration-marker {
                    width: 1.25rem;
                    height: 1.25rem;
                    border-radius: 9999px;
                    background-color: oklch(98% 0.01 250 / 0.8);
                    border: 1px solid oklch(85% 0.01 250);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                 .celebration-marker:hover {
                    transform: scale(1.1);
                }
            `}</style>
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        </>
    );
};