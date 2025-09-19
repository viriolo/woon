
import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '../constants';

interface MiniMapProps {
    center: { lng: number; lat: number };
}

export const MiniMap: React.FC<MiniMapProps> = ({ center }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            accessToken: MAPBOX_ACCESS_TOKEN,
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [center.lng, center.lat],
            zoom: 14,
            interactive: false,
            antialias: true,
        });

        const currentMap = map.current;

        currentMap.on('load', () => {
            new mapboxgl.Marker({ color: '#8b5cf6' }) // A purple marker consistent with special-primary
                .setLngLat([center.lng, center.lat])
                .addTo(currentMap);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [center]);

    return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
};