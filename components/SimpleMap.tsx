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
    const leafletRef = useRef<any>(null);

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
        if (!mapContainer.current || mapInstance) return;

        // Initialize Leaflet map
        const initMap = async () => {
            try {
                console.log('Starting map initialization...');

                // Dynamically import Leaflet
                const L = (await import('leaflet')).default;
                leafletRef.current = L;

                // Set up Leaflet CSS
                if (!document.querySelector('#leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);

                    // Wait for CSS to load
                    await new Promise(resolve => {
                        link.onload = resolve;
                        setTimeout(resolve, 1000); // Fallback timeout
                    });
                }

                console.log('Creating map with location:', userLocation);

                // Create map
                const map = L.map(mapContainer.current!, {
                    center: [userLocation.lat, userLocation.lng],
                    zoom: 13,
                    zoomControl: true,
                    scrollWheelZoom: true
                });

                // Add CartoDB tiles
                const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20
                });

                await new Promise((resolve, reject) => {
                    tileLayer.on('load', resolve);
                    tileLayer.on('error', reject);
                    tileLayer.addTo(map);
                    // Fallback timeout
                    setTimeout(resolve, 3000);
                });

                // Add user location marker
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative;">
                        <div style="position: absolute; inset: -8px; background: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: ping 1s infinite;"></div>
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
                setIsMapLoaded(false);
            }
        };

        initMap();
    }, [userLocation, onMapReady, mapInstance]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (mapInstance) {
                console.log('Cleaning up map instance');
                mapInstance.remove();
                setMapInstance(null);
                setIsMapLoaded(false);
            }
        };
    }, [mapInstance]);

    // Add celebration markers
    useEffect(() => {
        if (!mapInstance || !isMapLoaded || !leafletRef.current) return;

        const L = leafletRef.current;

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
                html: `<div style="width: ${isSelected ? '24px' : '20px'}; height: ${isSelected ? '24px' : '20px'}; background: ${isSelected ? '#f97316' : 'white'}; border: 2px solid #f97316; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: pointer; transition: all 0.2s;"></div>`,
                iconSize: [isSelected ? 24 : 20, isSelected ? 24 : 20],
                iconAnchor: [isSelected ? 12 : 10, isSelected ? 12 : 10]
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
        if (!mapInstance || !isMapLoaded || !showFriendsLayer || !leafletRef.current) return;

        const L = leafletRef.current;

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
                html: `<div style="width: ${isHighlighted ? '32px' : '24px'}; height: ${isHighlighted ? '32px' : '24px'}; background: linear-gradient(135deg, #a855f7, #3b82f6); border: 2px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3); cursor: pointer; transition: all 0.2s;"></div>`,
                iconSize: [isHighlighted ? 32 : 24, isHighlighted ? 32 : 24],
                iconAnchor: [isHighlighted ? 16 : 12, isHighlighted ? 16 : 12]
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