
import React, { useRef, useEffect } from 'react';
import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
import type { Celebration } from '../types';
import { USER_LOCATION, MAPBOX_ACCESS_TOKEN } from '../constants';

interface InteractiveMapProps {
    celebrations: Celebration[];
    selectedCelebrationId: number | null;
    onSelectCelebration: (id: number | null) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ celebrations, selectedCelebrationId, onSelectCelebration }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const selectedIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            accessToken: MAPBOX_ACCESS_TOKEN,
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [USER_LOCATION.lng, USER_LOCATION.lat],
            zoom: 12,
            pitch: 30,
            antialias: true,
        });
        
        const currentMap = map.current;

        currentMap.on('load', () => {
            // Add user location marker
            const userEl = document.createElement('div');
            userEl.className = 'w-4 h-4 rounded-full bg-blue-500 border-2 border-white relative shadow-md';
            const userPulse = document.createElement('div');
            userPulse.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-500/50 animate-ping-slow';
            userEl.appendChild(userPulse);

            new mapboxgl.Marker(userEl)
                .setLngLat([USER_LOCATION.lng, USER_LOCATION.lat])
                .addTo(currentMap);
            
            // Add a new source from our GeoJSON data and set the
            // 'cluster' option to true.
            currentMap.addSource('celebrations', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
                cluster: true,
                clusterMaxZoom: 13, // Max zoom to cluster points on
                clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
            });

            // Layer for clusters
            currentMap.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'celebrations',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': 'oklch(62% 0.17 240)',
                    'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            });

            // Layer for cluster count text
            currentMap.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'celebrations',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 14
                },
                paint: {
                    'text-color': '#ffffff'
                }
            });

            // Layer for unclustered points
            currentMap.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'celebrations',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': 'oklch(98% 0.01 250)',
                    'circle-radius': 8,
                    'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 3, 1],
                    'circle-stroke-color': ['case', ['boolean', ['feature-state', 'selected'], false], 'oklch(62% 0.17 240)', 'oklch(85% 0.01 250)'],
                }
            });

            // inspect a cluster on click
            currentMap.on('click', 'clusters', (e) => {
                const features = currentMap.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                if (!features.length) return;
                const clusterId = features[0].properties?.cluster_id;
                (currentMap.getSource('celebrations') as GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err) return;
                    currentMap.easeTo({
                        center: (features[0].geometry as any).coordinates,
                        zoom: zoom
                    });
                });
            });

            // select an unclustered point on click
            currentMap.on('click', 'unclustered-point', (e) => {
                if (!e.features?.length) return;
                const celebrationId = e.features[0].properties?.id;
                onSelectCelebration(celebrationId);
            });

            currentMap.on('mouseenter', ['clusters', 'unclustered-point'], () => { currentMap.getCanvas().style.cursor = 'pointer'; });
            currentMap.on('mouseleave', ['clusters', 'unclustered-point'], () => { currentMap.getCanvas().style.cursor = ''; });
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Sync GeoJSON data with celebrations prop
    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        const geojsonData: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
            type: 'FeatureCollection',
            features: celebrations.map(c => ({
                type: 'Feature',
                properties: { ...c },
                geometry: {
                    type: 'Point',
                    coordinates: [c.position.lng, c.position.lat],
                },
                id: c.id,
            })),
        };

        const source = map.current.getSource('celebrations') as GeoJSONSource;
        if (source) {
            source.setData(geojsonData);
        }
    }, [celebrations]);


    // Handle selection state
    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        if (selectedIdRef.current) {
            map.current.setFeatureState(
                { source: 'celebrations', id: selectedIdRef.current },
                { selected: false }
            );
        }
        
        if (selectedCelebrationId !== null) {
            map.current.setFeatureState(
                { source: 'celebrations', id: selectedCelebrationId },
                { selected: true }
            );
            
            const selectedCelebration = celebrations.find(c => c.id === selectedCelebrationId);
            if (selectedCelebration) {
                map.current.flyTo({
                    center: [selectedCelebration.position.lng, selectedCelebration.position.lat],
                    zoom: 14,
                    pitch: 45,
                    duration: 2000,
                    essential: true
                });
            }
        }
        
        selectedIdRef.current = selectedCelebrationId;

    }, [selectedCelebrationId, celebrations]);

    return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
};
