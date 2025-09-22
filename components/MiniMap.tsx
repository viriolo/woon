
import React, { useRef, useEffect, useState } from 'react';

interface MiniMapProps {
    center: { lng: number; lat: number };
}

export const MiniMap: React.FC<MiniMapProps> = ({ center }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!mapContainer.current || isLoaded) return;

        const initMap = async () => {
            try {
                // Dynamically import Leaflet
                const L = (await import('leaflet')).default;

                // Set up Leaflet CSS if not already present
                if (!document.querySelector('#leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);
                }

                // Create mini map
                const map = L.map(mapContainer.current!, {
                    zoomControl: false,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    boxZoom: false,
                    keyboard: false,
                    dragging: false,
                    touchZoom: false
                }).setView([center.lat, center.lng], 15);

                // Add CartoDB tiles
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20
                }).addTo(map);

                // Add location marker
                const markerIcon = L.divIcon({
                    className: 'mini-map-marker',
                    html: '<div class="w-4 h-4 bg-orange-500 border-2 border-white rounded-full shadow-md"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });

                L.marker([center.lat, center.lng], { icon: markerIcon }).addTo(map);

                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load mini map:', error);
            }
        };

        initMap();
    }, [center, isLoaded]);

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainer} className="w-full h-full rounded-lg" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="loading-spinner w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full mx-auto mb-1"></div>
                        <p className="text-xs text-gray-500">Loading...</p>
                    </div>
                </div>
            )}
        </div>
    );
};