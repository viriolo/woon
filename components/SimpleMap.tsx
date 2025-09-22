import React, { useEffect, useRef, useState } from "react";
import type { Celebration, UserLocation, FriendConnection } from "../types";
import { USER_LOCATION } from "../constants";

interface SimpleMapProps {
    celebrations: Celebration[];
    selectedCelebrationId: number | null;
    onSelectCelebration: (id: number | null) => void;
    friends: FriendConnection[];
    showFriendsLayer: boolean;
    onSelectFriend: (id: string | null) => void;
    highlightedFriendId: string | null;
    onMapReady?: (map: any) => void;
}

export const SimpleMap: React.FC<SimpleMapProps> = ({
    celebrations,
    selectedCelebrationId,
    onSelectCelebration,
    friends,
    showFriendsLayer,
    onSelectFriend,
    highlightedFriendId,
    onMapReady,
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const [userLocation, setUserLocation] = useState<UserLocation>(USER_LOCATION);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    useEffect(() => {
        const getUserLocation = async () => {
            if (!navigator.geolocation) {
                return;
            }

            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 8000,
                        maximumAge: 600000,
                    });
                });

                const newLocation = {
                    lng: position.coords.longitude,
                    lat: position.coords.latitude,
                };
                setUserLocation(newLocation);
            } catch (error) {
                console.log("Location access not available, using default location");
            }
        };

        getUserLocation();
    }, []);

    useEffect(() => {
        if (!mapContainer.current || isMapLoaded) return;

        // Initialize Leaflet map
        const initMap = async () => {
            try {
                // Dynamically import Leaflet
                const L = (await import('leaflet')).default;

                // Set up Leaflet CSS (inline styles for now)
                if (!document.querySelector('#leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);
                }

                // Create map
                const map = L.map(mapContainer.current!).setView([userLocation.lat, userLocation.lng], 13);

                // Add CartoDB tiles
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20
                }).addTo(map);

                // Add user location marker
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: `<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md relative">
                        <div class="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
                    </div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });

                L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('Your location');

                setMapInstance(map);
                setIsMapLoaded(true);

                if (onMapReady) {
                    onMapReady(map);
                }

                console.log('Map initialized successfully with CartoDB tiles');
            } catch (error) {
                console.error('Failed to initialize map:', error);
            }
        };

        initMap();

        return () => {
            if (mapInstance) {
                mapInstance.remove();
                setIsMapLoaded(false);
            }
        };
    }, [userLocation, onMapReady]);

    // Add celebration markers
    useEffect(() => {
        if (!mapInstance || !isMapLoaded) return;

        const L = (window as any).L;
        if (!L) return;

        // Clear existing celebration markers
        mapInstance.eachLayer((layer: any) => {
            if (layer.options && layer.options.celebration) {
                mapInstance.removeLayer(layer);
            }
        });

        // Add celebration markers
        celebrations.forEach((celebration) => {
            const isSelected = selectedCelebrationId === celebration.id;

            const celebrationIcon = L.divIcon({
                className: 'celebration-marker',
                html: `<div class="${isSelected ? 'w-6 h-6 bg-orange-500' : 'w-5 h-5 bg-white'} border-2 border-orange-500 rounded-full shadow-md cursor-pointer transition-all hover:scale-110"></div>`,
                iconSize: isSelected ? [24, 24] : [20, 20],
                iconAnchor: isSelected ? [12, 12] : [10, 10]
            });

            const marker = L.marker([celebration.position.lat, celebration.position.lng], {
                icon: celebrationIcon,
                celebration: true
            })
                .addTo(mapInstance)
                .on('click', () => {
                    onSelectCelebration(celebration.id);
                });

            if (isSelected) {
                marker.bindPopup(celebration.title).openPopup();
            }
        });
    }, [mapInstance, celebrations, selectedCelebrationId, onSelectCelebration, isMapLoaded]);

    // Add friend markers
    useEffect(() => {
        if (!mapInstance || !isMapLoaded || !showFriendsLayer) return;

        const L = (window as any).L;
        if (!L) return;

        // Clear existing friend markers
        mapInstance.eachLayer((layer: any) => {
            if (layer.options && layer.options.friend) {
                mapInstance.removeLayer(layer);
            }
        });

        // Add friend markers
        friends.forEach((friend) => {
            const isHighlighted = highlightedFriendId === friend.id;

            const friendIcon = L.divIcon({
                className: 'friend-marker',
                html: `<div class="${isHighlighted ? 'w-8 h-8' : 'w-6 h-6'} bg-gradient-to-br from-purple-400 to-blue-500 border-2 border-white rounded-full shadow-lg cursor-pointer transition-all hover:scale-110"></div>`,
                iconSize: isHighlighted ? [32, 32] : [24, 24],
                iconAnchor: isHighlighted ? [16, 16] : [12, 12]
            });

            const marker = L.marker([friend.location.lat, friend.location.lng], {
                icon: friendIcon,
                friend: true
            })
                .addTo(mapInstance)
                .on('click', () => {
                    onSelectFriend(friend.id);
                });

            if (isHighlighted) {
                marker.bindPopup(friend.name).openPopup();
            }
        });
    }, [mapInstance, friends, showFriendsLayer, highlightedFriendId, onSelectFriend, isMapLoaded]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
            {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="loading-spinner w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading map...</p>
                    </div>
                </div>
            )}
        </div>
    );
};