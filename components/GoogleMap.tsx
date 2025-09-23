import React, { useEffect, useRef, useState, useCallback } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import type { Celebration, UserLocation, FriendConnection } from "../types";
import { USER_LOCATION, GOOGLE_MAPS_API_KEY } from "../constants";

interface GoogleMapProps {
    celebrations: Celebration[];
    selectedCelebrationId: number | null;
    onSelectCelebration: (id: number | null) => void;
    friends: FriendConnection[];
    showFriendsLayer: boolean;
    onSelectFriend: (id: string | null) => void;
    highlightedFriendId: string | null;
    onMapReady?: (map: google.maps.Map) => void;
}

interface MapComponentProps extends GoogleMapProps {
    style: React.CSSProperties;
}

const MapComponent: React.FC<MapComponentProps> = ({
    celebrations,
    selectedCelebrationId,
    onSelectCelebration,
    friends,
    showFriendsLayer,
    onSelectFriend,
    highlightedFriendId,
    onMapReady,
    style,
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation>(USER_LOCATION);
    const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});

    // Get user location
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

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || map) return;

        console.log('Initializing Google Map...');

        const mapInstance = new google.maps.Map(mapRef.current, {
            center: { lat: userLocation.lat, lng: userLocation.lng },
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: "all",
                    elementType: "geometry.fill",
                    stylers: [{ color: "#f5f5f5" }]
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#c9d7e0" }]
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#ffffff" }]
                }
            ],
        });

        // Add user location marker
        const userMarker = new google.maps.Marker({
            position: { lat: userLocation.lat, lng: userLocation.lng },
            map: mapInstance,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
            },
            title: "Your location",
        });

        setMap(mapInstance);

        if (onMapReady) {
            onMapReady(mapInstance);
        }

        console.log('Google Map initialized successfully');
    }, [userLocation, onMapReady, map]);

    // Clear all markers
    const clearMarkers = useCallback(() => {
        Object.values(markersRef.current).forEach(marker => {
            marker.setMap(null);
        });
        markersRef.current = {};
    }, []);

    // Add celebration markers
    useEffect(() => {
        if (!map) return;

        // Clear existing celebration markers
        Object.keys(markersRef.current).forEach(key => {
            if (key.startsWith('celebration_')) {
                markersRef.current[key].setMap(null);
                delete markersRef.current[key];
            }
        });

        // Add celebration markers
        celebrations.forEach((celebration) => {
            const isSelected = selectedCelebrationId === celebration.id;
            const markerId = `celebration_${celebration.id}`;

            const marker = new google.maps.Marker({
                position: { lat: celebration.position.lat, lng: celebration.position.lng },
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: isSelected ? 12 : 10,
                    fillColor: isSelected ? "#f97316" : "#ffffff",
                    fillOpacity: 1,
                    strokeColor: "#f97316",
                    strokeWeight: 2,
                },
                title: celebration.title,
                zIndex: isSelected ? 1000 : 100,
            });

            marker.addListener('click', () => {
                onSelectCelebration(celebration.id);
            });

            if (isSelected) {
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px;">
                            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${celebration.title}</h3>
                            <p style="margin: 0; font-size: 12px; color: #666;">by ${celebration.author}</p>
                        </div>
                    `,
                });
                infoWindow.open(map, marker);

                // Store reference to close later
                (marker as any).infoWindow = infoWindow;
            }

            markersRef.current[markerId] = marker;
        });
    }, [map, celebrations, selectedCelebrationId, onSelectCelebration]);

    // Add friend markers
    useEffect(() => {
        if (!map || !showFriendsLayer) {
            // Remove friend markers if layer is hidden
            Object.keys(markersRef.current).forEach(key => {
                if (key.startsWith('friend_')) {
                    markersRef.current[key].setMap(null);
                    delete markersRef.current[key];
                }
            });
            return;
        }

        // Clear existing friend markers
        Object.keys(markersRef.current).forEach(key => {
            if (key.startsWith('friend_')) {
                markersRef.current[key].setMap(null);
                delete markersRef.current[key];
            }
        });

        // Add friend markers
        friends.forEach((friend) => {
            const isHighlighted = highlightedFriendId === friend.id;
            const markerId = `friend_${friend.id}`;

            const marker = new google.maps.Marker({
                position: { lat: friend.location.lat, lng: friend.location.lng },
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: isHighlighted ? 16 : 12,
                    fillColor: "#8b5cf6",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                },
                title: friend.name,
                zIndex: isHighlighted ? 1000 : 200,
            });

            marker.addListener('click', () => {
                onSelectFriend(friend.id);
            });

            if (isHighlighted) {
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px;">
                            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${friend.name}</h3>
                            <p style="margin: 0; font-size: 12px; color: #666;">${friend.celebrationMessage}</p>
                        </div>
                    `,
                });
                infoWindow.open(map, marker);

                // Store reference to close later
                (marker as any).infoWindow = infoWindow;
            }

            markersRef.current[markerId] = marker;
        });
    }, [map, friends, showFriendsLayer, highlightedFriendId, onSelectFriend]);

    // Cleanup
    useEffect(() => {
        return () => {
            clearMarkers();
        };
    }, [clearMarkers]);

    return <div ref={mapRef} style={style} />;
};

const LoadingComponent: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
            <div className="loading-spinner w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
        </div>
    </div>
);

const ErrorComponent: React.FC<{ error: Error }> = ({ error }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load Google Maps</p>
            <p className="text-sm text-gray-500">{error.message}</p>
            <p className="text-xs text-gray-400 mt-2">Please check your Google Maps API key</p>
        </div>
    </div>
);

export const GoogleMap: React.FC<GoogleMapProps> = (props) => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        return (
            <div className="relative w-full h-full">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <p className="text-red-600 mb-2">Google Maps API Key Required</p>
                        <p className="text-sm text-gray-500">Please add VITE_GOOGLE_MAPS_API_KEY to your .env.local file</p>
                        <p className="text-xs text-gray-400 mt-2">Get an API key from Google Cloud Console</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <Wrapper
                apiKey={GOOGLE_MAPS_API_KEY}
                render={(status) => {
                    switch (status) {
                        case "LOADING":
                            return <LoadingComponent />;
                        case "FAILURE":
                            return <ErrorComponent error={new Error("Failed to load Google Maps API")} />;
                        case "SUCCESS":
                            return (
                                <MapComponent
                                    {...props}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            );
                        default:
                            return <LoadingComponent />;
                    }
                }}
            />
        </div>
    );
};