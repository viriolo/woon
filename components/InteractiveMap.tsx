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
    const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading');

    // Get user's current location
    useEffect(() => {
        const getUserLocation = async () => {
            if (!navigator.geolocation) {
                setLocationStatus('unavailable');
                return;
            }

            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 300000 // 5 minutes
                        }
                    );
                });

                const newLocation = {
                    lng: position.coords.longitude,
                    lat: position.coords.latitude
                };

                setUserLocation(newLocation);
                setLocationStatus('granted');

                // Update map center if it exists
                if (map.current) {
                    map.current.flyTo({
                        center: [newLocation.lng, newLocation.lat],
                        zoom: 12,
                        duration: 2000
                    });
                }

            } catch (error) {
                console.warn('Location access denied or failed:', error);
                setLocationStatus('denied');
            }
        };

        getUserLocation();
    }, []);

    // Function to update user marker
    const updateUserMarker = (mapInstance: mapboxgl.Map) => {
        // Remove existing user marker
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        // Create user location marker with status-based styling
        const userEl = document.createElement('div');
        const pulseColor = locationStatus === 'granted' ? 'bg-blue-500' : 'bg-gray-500';

        userEl.className = `w-4 h-4 rounded-full ${pulseColor} border-2 border-white relative shadow-md`;

        const userPulse = document.createElement('div');
        userPulse.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${pulseColor}/50 animate-ping-slow`;
        userEl.appendChild(userPulse);

        // Add location status tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none transition-opacity';
        tooltip.textContent = locationStatus === 'granted' ? 'Your location' :
                             locationStatus === 'denied' ? 'Location access denied' :
                             locationStatus === 'loading' ? 'Getting location...' :
                             'Location unavailable';
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

    const requestLocation = () => {
        setLocationStatus('loading');
        const getUserLocation = async () => {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0 // Force fresh location
                        }
                    );
                });

                const newLocation = {
                    lng: position.coords.longitude,
                    lat: position.coords.latitude
                };

                setUserLocation(newLocation);
                setLocationStatus('granted');

                if (map.current) {
                    map.current.flyTo({
                        center: [newLocation.lng, newLocation.lat],
                        zoom: 14,
                        duration: 2000
                    });
                }
            } catch (error) {
                console.warn('Location access denied or failed:', error);
                setLocationStatus('denied');
            }
        };
        getUserLocation();
    };

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

            {/* Location Status & Control */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {locationStatus === 'denied' && (
                    <button
                        onClick={requestLocation}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        📍 Enable Location
                    </button>
                )}

                {locationStatus === 'loading' && (
                    <div className="bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Getting location...
                    </div>
                )}

                {locationStatus === 'granted' && (
                    <button
                        onClick={requestLocation}
                        className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                        🎯 Update Location
                    </button>
                )}

                {locationStatus === 'unavailable' && (
                    <div className="bg-gray-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
                        ❌ Location unavailable
                    </div>
                )}
            </div>
        </>
    );
};