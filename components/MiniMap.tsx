import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { GOOGLE_MAPS_API_KEY } from "../constants";

interface MiniMapProps {
    center: { lat: number; lng: number };
    zoom?: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({ center, zoom = 15 }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const initMap = async () => {
            if (!containerRef.current || mapRef.current || !GOOGLE_MAPS_API_KEY) {
                return;
            }

            try {
                const loader = new Loader({
                    apiKey: GOOGLE_MAPS_API_KEY,
                    version: "weekly",
                    libraries: ["places"]
                });

                const google = await loader.load();
                if (cancelled) return;

                const map = new google.maps.Map(containerRef.current, {
                    center: { lat: center.lat, lng: center.lng },
                    zoom: zoom,
                    disableDefaultUI: true,
                    gestureHandling: 'none',
                    keyboardShortcuts: false,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        },
                        {
                            featureType: "transit",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                });

                const marker = new google.maps.Marker({
                    position: { lat: center.lat, lng: center.lng },
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#f47b25',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#ffffff',
                    }
                });

                mapRef.current = map;
                markerRef.current = marker;
                setIsReady(true);
            } catch (error) {
                console.error("Failed to initialize mini map:", error);
            }
        };

        initMap();

        return () => {
            cancelled = true;
            mapRef.current = null;
            markerRef.current = null;
        };
    }, [zoom]);

    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;

        if (!map || !marker) return;

        const newCenter = { lat: center.lat, lng: center.lng };
        map.setCenter(newCenter);
        marker.setPosition(newCenter);
    }, [center.lat, center.lng]);

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="relative h-full w-full bg-gray-100 flex items-center justify-center">
                <div className="text-center text-xs text-gray-500">
                    <p>Map unavailable</p>
                    <p>Missing API key</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full rounded-lg" />
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="loading-spinner mx-auto mb-2 h-5 w-5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-500">Loading map...</p>
                    </div>
                </div>
            )}
        </div>
    );
};