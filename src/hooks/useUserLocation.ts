import { useCallback, useState } from "react";
import type { UserLocation } from "../../types";
import { USER_LOCATION } from "../../constants";

interface UseUserLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<boolean>;
}

export const useUserLocation = (): UseUserLocationResult => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLocation(USER_LOCATION);
      return false;
    }

    setLoading(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setError(null);
          setLoading(false);
          resolve(true);
        },
        (geoError) => {
          console.warn("Unable to retrieve location:", geoError);
          setError(
            geoError.code === geoError.PERMISSION_DENIED
              ? "Location permission denied"
              : "Unable to determine your location"
          );
          setLocation(USER_LOCATION);
          setLoading(false);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  return { location, loading, error, requestLocation };
};
