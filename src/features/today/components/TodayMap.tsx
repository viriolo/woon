import React, { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Celebration, UserLocation } from "../../../../types";
import { mapboxConfig } from "../../../config/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = mapboxConfig.accessToken;

interface TodayMapProps {
  celebrations: Celebration[];
  userLocation: UserLocation | null;
  isLoading: boolean;
  selectedCelebrationId: number | null;
  onSelectCelebration: (celebration: Celebration) => void;
}

const MAP_SOURCE_ID = "celebrations";

const buildGeoJson = (celebrations: Celebration[]) => ({
  type: "FeatureCollection" as const,
  features: celebrations.map((celebration) => ({
    type: "Feature" as const,
    properties: {
      id: celebration.id,
      title: celebration.title,
      author: celebration.author,
    },
    geometry: {
      type: "Point" as const,
      coordinates: [celebration.position.lng, celebration.position.lat],
    },
  })),
});

export const TodayMap: React.FC<TodayMapProps> = ({
  celebrations,
  userLocation,
  isLoading,
  selectedCelebrationId,
  onSelectCelebration,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const hasCenteredOnUserRef = useRef(false);

  const geojson = useMemo(() => buildGeoJson(celebrations), [celebrations]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapboxConfig.accessToken) {
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapboxConfig.style,
      center: [-122.4194, 37.7749],
      zoom: 11,
      attributionControl: false,
      cooperativeGestures: true,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      map.addSource(MAP_SOURCE_ID, {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 60,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: MAP_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#8B5CF6",
            10,
            "#C4B5FD",
            25,
            "#8B5CF6",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            10,
            24,
            25,
            32,
          ],
          "circle-opacity": 0.85,
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: MAP_SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#1c120c",
        },
      });

      map.addLayer({
        id: "celebration-point",
        type: "circle",
        source: MAP_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#ffffff",
          "circle-radius": 10,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#8B5CF6",
          "circle-opacity": 0.9,
        },
      });

      map.on("click", "clusters", (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const clusterSource = map.getSource(MAP_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

        if (!clusterSource || typeof clusterId !== "number") {
          return;
        }

        clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const coordinates = features[0]?.geometry?.coordinates as [number, number];
          map.easeTo({ center: coordinates, zoom });
        });
      });

      map.on("click", "celebration-point", (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["celebration-point"] });
        const celebrationId = Number(features[0]?.properties?.id);
        const celebration = celebrations.find((item) => item.id === celebrationId);
        if (celebration) {
          onSelectCelebration(celebration);
        }
      });

      map.on("mouseenter", "celebration-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "celebration-point", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    const source = map.getSource(MAP_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson as any);
    }
  }, [geojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) {
      return;
    }

    if (!userMarkerRef.current) {
      userMarkerRef.current = new mapboxgl.Marker({ color: "#2678ff", scale: 1.1 })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }

    if (!hasCenteredOnUserRef.current) {
      map.easeTo({ center: [userLocation.lng, userLocation.lat], zoom: 12.5, duration: 800 });
      hasCenteredOnUserRef.current = true;
    }
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCelebrationId) {
      return;
    }

    const celebration = celebrations.find((item) => item.id === selectedCelebrationId);
    if (!celebration) return;

    map.easeTo({
      center: [celebration.position.lng, celebration.position.lat],
      zoom: Math.max(map.getZoom(), 13),
      duration: 800,
    });
  }, [celebrations, selectedCelebrationId]);

  if (!mapboxConfig.accessToken) {
    return (
      <div className="today-map today-map--fallback">
        <p>Map view needs configuration. Add a Mapbox token to explore celebrations nearby.</p>
      </div>
    );
  }

  return (
    <div className="today-map" aria-busy={isLoading}>
      <div ref={containerRef} className="today-map__canvas" role="presentation" />
    </div>
  );
};
