const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

if (!MAPBOX_TOKEN) {
  console.warn(
    "Mapbox token is not configured. Set VITE_MAPBOX_ACCESS_TOKEN in your environment to enable map rendering."
  );
}

export const mapboxConfig = {
  accessToken: MAPBOX_TOKEN ?? "",
  style: import.meta.env.VITE_MAPBOX_STYLE_URL ?? "mapbox://styles/mapbox/light-v11",
};
