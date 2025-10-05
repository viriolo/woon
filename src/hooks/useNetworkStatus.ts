import { useEffect, useState } from "react";

interface NetworkStatus {
  isOnline: boolean;
  lastChangeAt: number;
}

const getInitialStatus = (): NetworkStatus => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  lastChangeAt: Date.now(),
});

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>(getInitialStatus);

  useEffect(() => {
    const handleOnline = () => setStatus({ isOnline: true, lastChangeAt: Date.now() });
    const handleOffline = () => setStatus({ isOnline: false, lastChangeAt: Date.now() });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return status;
};
