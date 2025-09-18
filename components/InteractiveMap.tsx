import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import type { Celebration } from '../types';
import { USER_LOCATION, MAPBOX_ACCESS_TOKEN } from '../constants';
import { HeartIcon } from './icons';

// A simplified card component specifically for the Mapbox popup
const CelebrationPopupCard: React.FC<{ celebration: Celebration }> = ({ celebration }) => (
    <div className="w-64 bg-neutral-800/80 backdrop-blur-xl text-white rounded-lg overflow-hidden">
        <img src={celebration.imageUrl} alt={celebration.title} className="w-full h-32 object-cover" />
        <div className="p-3">
            <h3 className="font-bold text-white">{celebration.title}</h3>
            <p className="text-sm text-neutral-400 mb-2">by {celebration.author}</p>
            <div className="flex items-center text-special-primary">
                <HeartIcon className="w-5 h-5 mr-1" />
                <span className="font-bold">{celebration.likes}</span>
            </div>
        </div>
    </div>
);

export const InteractiveMap: React.FC<{ celebrations: Celebration[] }> = ({ celebrations }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        if (map.current || !mapContainer.current) return; // initialize map only once

        // Set the access token globally
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [USER_LOCATION.lng, USER_LOCATION.lat],
            zoom: 12,
            pitch: 60, // 3D perspective
            antialias: true,
        });
        
        map.current.on('load', () => {
             if (!map.current) return;

            // Add User Marker
            const userEl = document.createElement('div');
            userEl.className = 'w-4 h-4 rounded-full bg-blue-400 border-2 border-white relative';
            const userPulse = document.createElement('div');
            userPulse.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-400/50 animate-ping-slow';
            userEl.appendChild(userPulse);

            new mapboxgl.Marker(userEl)
                .setLngLat([USER_LOCATION.lng, USER_LOCATION.lat])
                .addTo(map.current);

            // Add Celebration Markers
            celebrations.forEach(celebration => {
                const el = document.createElement('div');
                el.className = `w-8 h-8 rounded-full border-2 bg-neutral-800 cursor-pointer transition-all duration-300 hover:scale-125`;
                el.style.backgroundImage = `url(${celebration.imageUrl})`;
                el.style.backgroundSize = 'cover';

                const marker = new mapboxgl.Marker(el)
                    .setLngLat([celebration.position.lng, celebration.position.lat])
                    .addTo(map.current!);
                
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setSelectedId(celebration.id);
                    
                    if (popupRef.current) {
                        popupRef.current.remove();
                    }
                    
                    const popupNode = document.createElement('div');
                    const root = ReactDOM.createRoot(popupNode);
                    root.render(<CelebrationPopupCard celebration={celebration} />);

                    popupRef.current = new mapboxgl.Popup({ 
                        offset: 25, 
                        closeButton: false,
                        className: 'mapbox-popup-custom'
                    })
                        .setLngLat([celebration.position.lng, celebration.position.lat])
                        .setDOMContent(popupNode)
                        .addTo(map.current!);
                    
                    popupRef.current.on('close', () => {
                        setSelectedId(null);
                        root.unmount();
                    });
                });
            });
        });

        return () => {
            map.current?.remove();
        };

    }, [celebrations]);

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
            `}</style>
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        </>
    );
};