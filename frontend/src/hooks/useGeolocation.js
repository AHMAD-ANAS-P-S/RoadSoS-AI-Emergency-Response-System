import { useState, useEffect } from 'react';

/**
 * useGeolocation — GPS location hook with IP-based fallback.
 * 1. Tries browser GPS (high accuracy)
 * 2. If denied/unavailable, falls back to ip-api.com (free, no key)
 * Returns { location: {lat, lon, accuracy, address, source}, error, loading }
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let watchId = null;
    let cancelled = false;

    async function tryIPFallback() {
      try {
        const resp = await fetch('https://ip-api.com/json/?fields=lat,lon,city,regionName,country,status', {
          signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
        });
        const data = await resp.json();
        if (!cancelled && data.status === 'success') {
          setLocation({
            lat: data.lat,
            lon: data.lon,
            accuracy: 5000, // IP-level accuracy ~5km
            address: [data.city, data.regionName, data.country].filter(Boolean).join(', '),
            source: 'ip',
          });
          setLoading(false);
          // Don't clear the error so the UI knows GPS was denied
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported on this browser');
      setLoading(false);
      tryIPFallback();
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (cancelled) return;
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        const loc = { lat, lon, accuracy, source: 'gps' };

        // Reverse geocode (non-blocking, best-effort)
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await resp.json();
          loc.address = data.display_name?.split(',').slice(0, 3).join(', ');
        } catch { /* ignore */ }

        setLocation(loc);
        setLoading(false);
        setError(null); // GPS success — clear any previous error
      },
      async (err) => {
        if (cancelled) return;
        setError(err.message); // e.g. "User denied Geolocation"
        setLoading(false);
        // Fall back to IP location so the app still works
        await tryIPFallback();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error, loading };
}
