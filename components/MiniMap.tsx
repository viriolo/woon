import React, { useEffect, useRef, useState } from "react";

type LeafletModule = typeof import("leaflet");

interface MiniMapProps {
    center: { lat: number; lng: number };
    zoom?: number;
}

const ensureLeafletStyles = () => {
    if (document.getElementById("leaflet-css")) {
        return;
    }
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "";
    document.head.appendChild(link);
};

const createMarkerIcon = (L: LeafletModule) =>
    L.divIcon({
        className: "mini-map-marker",
        html: '<div class="w-4 h-4 bg-orange-500 border-2 border-white rounded-full shadow-md"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });

export const MiniMap: React.FC<MiniMapProps> = ({ center, zoom = 15 }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<import("leaflet").Map | null>(null);
    const markerRef = useRef<import("leaflet").Marker | null>(null);
    const leafletModuleRef = useRef<LeafletModule | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const initMap = async () => {
            if (!containerRef.current || mapRef.current) {
                return;
            }

            try {
                const module = await import("leaflet");
                if (cancelled) {
                    return;
                }
                const L = (module.default ?? module) as LeafletModule;
                leafletModuleRef.current = L;
                ensureLeafletStyles();

                const map = L.map(containerRef.current, {
                    zoomControl: false,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    boxZoom: false,
                    keyboard: false,
                    dragging: false,
                    touchZoom: false,
                });

                map.setView([center.lat, center.lng], zoom);

                L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: "abcd",
                    maxZoom: 20,
                }).addTo(map);

                const markerIcon = createMarkerIcon(L);
                const marker = L.marker([center.lat, center.lng], { icon: markerIcon }).addTo(map);

                mapRef.current = map;
                markerRef.current = marker;
                setIsReady(true);
            } catch (error) {
                console.error("Failed to initialise mini map:", error);
            }
        };

        initMap();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            markerRef.current = null;
            leafletModuleRef.current = null;
        };
    }, [zoom]);

    useEffect(() => {
        const map = mapRef.current;
        const L = leafletModuleRef.current;
        if (!map || !L) {
            return;
        }

        const { lat, lng } = center;
        map.setView([lat, lng], map.getZoom());

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            const markerIcon = createMarkerIcon(L);
            markerRef.current = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
        }
    }, [center.lat, center.lng]);

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full" />
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <div className="loading-spinner mx-auto mb-2 h-5 w-5 border-2 border-orange-200 border-t-orange-500 rounded-full"></div>
                        <p className="text-xs text-gray-500">Loading map...</p>
                    </div>
                </div>
            )}
        </div>
    );
};
