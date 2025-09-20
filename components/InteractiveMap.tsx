import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Celebration, UserLocation } from '../types';
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
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

    const [userLocation, setUserLocation] = useState<UserLocation>(USER_LOCATION);
    const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

    // Silently get user's current location in background
    useEffect(() => {
        const getUserLocation = async () => {
            if (!navigator.geolocation) {
                setLocationStatus('denied');
                return;
            }

            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: true,
                            timeout: 8000,
                            maximumAge: 600000 // 10 minutes
                        }
                    );
                });

                const newLocation = {
                    lng: position.coords.longitude,
                    lat: position.coords.latitude
                };

                setUserLocation(newLocation);
                setLocationStatus('granted');

                // Smoothly update map center if it exists
                if (map.current) {
                    map.current.flyTo({
                        center: [newLocation.lng, newLocation.lat],
                        zoom: 12,
                        duration: 1500
                    });
                }

            } catch (error) {
                // Silently fail without user notification
                console.log('Location access not available, using default location');
                setLocationStatus('denied');
            }
        };

        // Delay location request to avoid interfering with initial UI
        const timeoutId = setTimeout(getUserLocation, 1000);
        return () => clearTimeout(timeoutId);
    }, []);

    // Function to update user marker based on location status
    const updateUserMarker = (mapInstance: mapboxgl.Map) => {
        // Remove existing user marker
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        // Create user location marker
        const userEl = document.createElement('div');
        const color = locationStatus === 'granted' ? 'bg-blue-500' : 'bg-gray-500';
        const borderColor = locationStatus === 'granted' ? 'border-blue-600' : 'border-gray-600';

        userEl.className = `w-4 h-4 rounded-full ${color} border-2 border-white ${borderColor} relative shadow-md cursor-pointer`;

        const userPulse = document.createElement('div');
        userPulse.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${color}/30 animate-ping-slow`;
        userEl.appendChild(userPulse);

        // Add subtle tooltip on hover (no buttons)
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none transition-opacity whitespace-nowrap';
        tooltip.textContent = locationStatus === 'granted' ? 'Your current location' : 'Default location (SF)';
        userEl.appendChild(tooltip);

        userEl.addEventListener('mouseenter', () => {
            tooltip.classList.remove('opacity-0');
        });
        userEl.addEventListener('mouseleave', () => {
            tooltip.classList.add('opacity-0');
        });

        userMarkerRef.current = new mapboxgl.Marker(userEl)
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(mapInstance);
    };

    // Update user marker when location changes
    useEffect(() => {
        if (map.current) {
            updateUserMarker(map.current);
        }
    }, [userLocation, locationStatus]);

    // Initialize map
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            accessToken: MAPBOX_ACCESS_TOKEN,
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [userLocation.lng, userLocation.lat],
            zoom: 12,
            pitch: 30,
            antialias: true,
        });

        const currentMap = map.current;

        currentMap.on('load', () => {
            updateUserMarker(currentMap);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [userLocation]);

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