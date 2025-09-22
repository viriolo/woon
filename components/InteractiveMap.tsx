import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Celebration, UserLocation, FriendConnection } from "../types";
import { USER_LOCATION, MAPBOX_ACCESS_TOKEN } from "../constants";

interface InteractiveMapProps {
    celebrations: Celebration[];
    selectedCelebrationId: number | null;
    onSelectCelebration: (id: number | null) => void;
    friends: FriendConnection[];
    showFriendsLayer: boolean;
    onSelectFriend: (id: string | null) => void;
    highlightedFriendId: string | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
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
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [id: number]: { marker: mapboxgl.Marker; element: HTMLDivElement } }>({});
    const friendMarkersRef = useRef<{ [id: string]: { marker: mapboxgl.Marker; element: HTMLDivElement } }>({});
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

    const [userLocation, setUserLocation] = useState<UserLocation>(USER_LOCATION);
    const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied">("loading");
    const [mapLoadError, setMapLoadError] = useState<string | null>(null);

    useEffect(() => {
        const getUserLocation = async () => {
            if (!navigator.geolocation) {
                setLocationStatus("denied");
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
                setLocationStatus("granted");

                if (map.current) {
                    map.current.flyTo({
                        center: [newLocation.lng, newLocation.lat],
                        zoom: 12,
                        duration: 1500,
                    });
                }
            } catch (error) {
                console.log("Location access not available, using default location");
                setLocationStatus("denied");
            }
        };

        const timeoutId = setTimeout(getUserLocation, 1000);
        return () => clearTimeout(timeoutId);
    }, []);

    const updateUserMarker = (mapInstance: mapboxgl.Map) => {
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        const userEl = document.createElement("div");
        const color = locationStatus === "granted" ? "bg-blue-500" : "bg-gray-500";
        const borderColor = locationStatus === "granted" ? "border-blue-600" : "border-gray-600";

        userEl.className = `w-4 h-4 rounded-full ${color} border-2 border-white ${borderColor} relative shadow-md cursor-pointer`;

        const userPulse = document.createElement("div");
        userPulse.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-500/30 animate-ping-slow";
        userEl.appendChild(userPulse);

        const tooltip = document.createElement("div");
        tooltip.className = "absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none transition-opacity whitespace-nowrap";
        tooltip.textContent = locationStatus === "granted" ? "Your current location" : "Default location (SF)";
        userEl.appendChild(tooltip);

        userEl.addEventListener("mouseenter", () => {
            tooltip.classList.remove("opacity-0");
        });
        userEl.addEventListener("mouseleave", () => {
            tooltip.classList.add("opacity-0");
        });

        userMarkerRef.current = new mapboxgl.Marker(userEl).setLngLat([userLocation.lng, userLocation.lat]).addTo(mapInstance);
    };

    useEffect(() => {
        if (map.current) {
            updateUserMarker(map.current);
        }
    }, [userLocation, locationStatus]);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        console.log('Initializing map with token:', MAPBOX_ACCESS_TOKEN ? 'token present' : 'token missing');

        if (!MAPBOX_ACCESS_TOKEN) {
            console.error('Mapbox access token is missing, map will not load');
            setMapLoadError('Map configuration missing. Please check environment variables.');
            return;
        }

        try {
            map.current = new mapboxgl.Map({
                accessToken: MAPBOX_ACCESS_TOKEN,
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/light-v11",
                center: [userLocation.lng, userLocation.lat],
                zoom: 12,
                pitch: 30,
                antialias: true,
            });
            console.log('Map initialized successfully');
            setMapLoadError(null);
        } catch (error) {
            console.error('Failed to initialize map:', error);
            setMapLoadError(`Failed to load map: ${error}`);
        }

        const currentMap = map.current;
        if (currentMap && onMapReady) {
            onMapReady(currentMap);
        }

        currentMap.on("load", () => {
            updateUserMarker(currentMap);
        });

        currentMap.on("click", () => {
            onSelectFriend(null);
            onSelectCelebration(null);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [userLocation, onSelectCelebration, onSelectFriend]);

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
                const el = document.createElement("div");
                el.className = "celebration-marker";

                const marker = new mapboxgl.Marker(el)
                    .setLngLat([celebration.position.lng, celebration.position.lat])
                    .addTo(currentMap);

                el.addEventListener("click", (event) => {
                    event.stopPropagation();
                    onSelectFriend(null);
                    onSelectCelebration(celebration.id);
                });

                markersRef.current[celebration.id] = { marker, element: el };
            }
        });
    }, [celebrations, onSelectCelebration, onSelectFriend]);

    useEffect(() => {
        if (!map.current) return;
        const currentMap = map.current;

        Object.values(friendMarkersRef.current).forEach(({ marker }) => marker.remove());
        friendMarkersRef.current = {};

        if (!showFriendsLayer) {
            return;
        }

        friends.forEach(friend => {
            const el = document.createElement("div");
            el.className = "friend-marker";
            if (friend.id === highlightedFriendId) {
                el.classList.add("friend-marker--active");
            }

            const marker = new mapboxgl.Marker(el)
                .setLngLat([friend.location.lng, friend.location.lat])
                .addTo(currentMap);

            el.addEventListener("click", (event) => {
                event.stopPropagation();
                onSelectCelebration(null);
                onSelectFriend(friend.id);
                currentMap.flyTo({
                    center: [friend.location.lng, friend.location.lat],
                    zoom: 14,
                    pitch: 45,
                    duration: 1500,
                });
            });

            friendMarkersRef.current[friend.id] = { marker, element: el };
        });
    }, [friends, showFriendsLayer, highlightedFriendId, onSelectCelebration, onSelectFriend]);

    useEffect(() => {
        if (!selectedCelebrationId || !map.current) return;

        const selectedCelebration = celebrations.find(c => c.id === selectedCelebrationId);
        if (!selectedCelebration) return;

        map.current.flyTo({
            center: [selectedCelebration.position.lng, selectedCelebration.position.lat],
            zoom: 14,
            pitch: 45,
            duration: 2000,
            essential: true,
        });
    }, [selectedCelebrationId, celebrations]);

    if (mapLoadError) {
        return (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-100">
                <div className="text-center p-6">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-2">Map Unavailable</h3>
                    <p className="text-sm text-neutral-600">{mapLoadError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-special-primary text-white rounded-full text-sm font-medium hover:opacity-90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .celebration-marker {
                    width: 1.25rem;
                    height: 1.25rem;
                    border-radius: 9999px;
                    background-color: oklch(98% 0.01 250 / 0.85);
                    border: 1px solid oklch(85% 0.01 250);
                    box-shadow: 0 1px 4px rgba(0,0,0,0.18);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .celebration-marker:hover {
                    transform: scale(1.08);
                }
                .friend-marker {
                    width: 1.5rem;
                    height: 1.5rem;
                    border-radius: 9999px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border: 2px solid white;
                    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.4);
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .friend-marker:hover, .friend-marker--active {
                    transform: scale(1.12);
                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.55);
                }
            `}</style>
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        </>
    );
};
