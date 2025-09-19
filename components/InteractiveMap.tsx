
import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { Root } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import type { Celebration } from '../types';
import { USER_LOCATION, MAPBOX_ACCESS_TOKEN } from '../constants';
import { HeartIcon, XIcon } from './icons';

interface InteractiveMapProps {
    celebrations: Celebration[];
    selectedCelebrationId: number | null;
    onSelectCelebration: (id: number | null) => void;
}

const CelebrationPopupCard: React.FC<{ celebration: Celebration; onClose: () => void; }> = ({ celebration, onClose }) => (
    <div className="relative w-64 bg-white/80 backdrop-blur-xl text-neutral-900 rounded-lg overflow-hidden shadow-2xl shadow-black/20">
        <button onClick={onClose} className="absolute top-2 right-2 z-10 p-1 bg-black/10 rounded-full text-black/50 hover:text-black/100 transition-colors" aria-label="Close popup">
            <XIcon className="w-5 h-5" />
        </button>
        <img src={celebration.imageUrl} alt={celebration.title} className="w-full h-32 object-cover" />
        <div className="p-3">
            <h3 className="font-bold text-neutral-900 pr-6">{celebration.title}</h3>
            <p className="text-sm text-neutral-500 mb-2">by {celebration.author}</p>
            <div className="flex items-center text-special-primary">
                <HeartIcon className="w-5 h-5 mr-1" />
                <span className="font-bold">{celebration.likes}</span>
            </div>
        </div>
    </div>
);

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ celebrations, selectedCelebrationId, onSelectCelebration }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [id: number]: { marker: mapboxgl.Marker, element: HTMLDivElement } }>({});
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const popupRootRef = useRef<Root | null>(null);
    const isClosingProgrammatically = useRef(false);

    // Initialize map
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            accessToken: MAPBOX_ACCESS_TOKEN,
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [USER_LOCATION.lng, USER_LOCATION.lat],
            zoom: 12,
            pitch: 60,
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
                el.style.backgroundImage = `url(${celebration.imageUrl})`;

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

    // Handle selection: highlight marker and show popup
    useEffect(() => {
        Object.values(markersRef.current).forEach(({ element }) => {
            element.classList.remove('selected');
        });

        isClosingProgrammatically.current = true;
        popupRef.current?.remove();
        popupRootRef.current?.unmount();
        popupRootRef.current = null;
        isClosingProgrammatically.current = false;
        
        if (!selectedCelebrationId || !map.current) return;
        
        const selectedCelebration = celebrations.find(c => c.id === selectedCelebrationId);
        if (!selectedCelebration) return;

        if (markersRef.current[selectedCelebrationId]) {
            const { element } = markersRef.current[selectedCelebrationId];
            element.classList.add('selected');
        }

        map.current.flyTo({
            center: [selectedCelebration.position.lng, selectedCelebration.position.lat],
            zoom: 15,
            pitch: 60,
            duration: 2000,
            essential: true
        });

        const popupNode = document.createElement('div');
        const root = ReactDOM.createRoot(popupNode);
        root.render(<CelebrationPopupCard celebration={selectedCelebration} onClose={() => onSelectCelebration(null)} />);
        popupRootRef.current = root;

        const popup = new mapboxgl.Popup({ 
            offset: 25, 
            closeButton: false,
            className: 'mapbox-popup-custom'
        })
        .setLngLat([selectedCelebration.position.lng, selectedCelebration.position.lat])
        .setDOMContent(popupNode)
        .addTo(map.current);
        
        popup.on('close', () => {
            if (!isClosingProgrammatically.current) {
                onSelectCelebration(null);
            }
            root.unmount();
            popupRootRef.current = null;
        });

        popupRef.current = popup;

    }, [selectedCelebrationId, celebrations, onSelectCelebration]);

    return (
        <>
            <style>{`
                .mapbox-popup-custom .mapboxgl-popup-content {
                    background: transparent;
                    padding: 0;
                    box-shadow: none;
                }
                .mapbox-popup-custom .mapboxgl-popup-tip {
                    display: none;
                }
                .celebration-marker {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 9999px;
                    border-width: 2px;
                    border-color: white;
                    background-color: oklch(96% 0.01 250);
                    background-size: cover;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .celebration-marker:hover {
                    transform: scale(1.25);
                }
                .celebration-marker.selected {
                    transform: scale(1.25);
                    border-color: oklch(65% 0.15 250);
                    z-index: 10;
                    animation: pulse-border 2s infinite;
                }
                @keyframes pulse-border {
                    0%, 100% { box-shadow: 0 0 0 0px oklch(65% 0.15 250 / 0.7), 0 2px 4px rgba(0,0,0,0.2); }
                    50% { box-shadow: 0 0 0 4px oklch(65% 0.15 250 / 0), 0 2px 4px rgba(0,0,0,0.2); }
                }
            `}</style>
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        </>
    );
};