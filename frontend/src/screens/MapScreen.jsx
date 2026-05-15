import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '../hooks/useGeolocation';
import { queryNearest, queryNearestOnline } from '../services/spatialQuery';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png', iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png' });

const CAT_COLORS = { hospital:'#ef4444', ambulance:'#f97316', police:'#3b82f6', towing:'#8b5cf6', puncture:'#10b981' };
const CAT_ICONS = { hospital:'🏥', ambulance:'🚑', police:'👮', towing:'🔧', puncture:'🔩' };

function createCategoryIcon(cat) {
  return L.divIcon({
    html: `<div style="background:${CAT_COLORS[cat]||'#ef4444'};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${CAT_ICONS[cat]||'📍'}</div>`,
    className: '', iconSize: [32,32], iconAnchor: [16,16],
  });
}

function userIcon() {
  return L.divIcon({
    html: `<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(239,68,68,0.4)"></div>`,
    className: '', iconSize: [16,16], iconAnchor: [8,8],
  });
}

function MapCenterer({ lat, lon }) {
  const map = useMap();
  useEffect(() => { if (lat && lon) map.setView([lat, lon], 14); }, [lat, lon, map]);
  return null;
}

export default function MapScreen() {
  const { location } = useGeolocation();
  const [services, setServices] = useState({}); // changed to object: { category: [results] }
  const [activeFilters, setActiveFilters] = useState(['hospital', 'ambulance', 'police']);
  const [loadingCats, setLoadingCats] = useState(new Set());
  const [loadedCats, setLoadedCats] = useState(new Set());

  // Unified fetcher for a single category
  const fetchCategory = async (cat, lat, lon, force = false) => {
    if (!lat || !lon) return;
    if (!force && loadedCats.has(cat)) return;

    setLoadingCats(prev => new Set(prev).add(cat));
    try {
      const results = navigator.onLine
        ? await queryNearestOnline(cat, lat, lon, 5000, 8)
        : await queryNearest(cat, lat, lon, 8);
      
      const formatted = results.filter(r => r.lat && r.lon).map(r => ({ ...r, category: cat }));
      
      setServices(prev => ({ ...prev, [cat]: formatted }));
      setLoadedCats(prev => new Set(prev).add(cat));
    } catch (err) {
      console.error(`Failed to fetch ${cat}:`, err);
    } finally {
      setLoadingCats(prev => {
        const next = new Set(prev);
        next.delete(cat);
        return next;
      });
    }
  };

  // Reset when location changes
  useEffect(() => {
    if (location) {
      setServices({});
      setLoadedCats(new Set());
      // Initial fetch for default filters
      activeFilters.forEach(cat => fetchCategory(cat, location.lat, location.lon));
    }
  }, [location?.lat, location?.lon]);

  // Fetch when filters change
  useEffect(() => {
    if (location) {
      activeFilters.forEach(cat => {
        if (!loadedCats.has(cat)) {
          fetchCategory(cat, location.lat, location.lon);
        }
      });
    }
  }, [activeFilters, location, loadedCats]);

  const toggleFilter = (cat) => {
    setActiveFilters(prev => prev.includes(cat) ? prev.filter(c=>c!==cat) : [...prev, cat]);
  };

  const visible = activeFilters.flatMap(cat => services[cat] || []);

  // Measure the header height dynamically — use a ref instead of guessing
  const headerRef = React.useRef(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-base)' }}>
      <div className="map-header" style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🗺️</div>
          <div>
            <h2 style={{ color: '#f0f4ff', fontWeight: 800, fontSize: 18, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em' }}>Emergency Map</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Nearby services in real-time</p>
          </div>
          {loadingCats.size > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontSize: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid rgba(96,165,250,0.3)', borderTop: '2px solid #60a5fa', animation: 'spin 1s linear infinite' }} />
              Updating…
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {Object.entries(CAT_ICONS).map(([cat, icon]) => {
            const active = activeFilters.includes(cat);
            return (
              <button key={cat} onClick={() => toggleFilter(cat)} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 12, transition: 'all 0.2s', whiteSpace: 'nowrap',
                background: active ? CAT_COLORS[cat] : 'rgba(255,255,255,0.06)',
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: active ? `0 4px 14px ${CAT_COLORS[cat]}50` : 'none',
                transform: active ? 'translateY(-1px)' : 'none',
              }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ textTransform: 'capitalize' }}>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <MapContainer
          center={location ? [location.lat, location.lon] : [13.0827, 80.2707]}
          zoom={13}
          style={{ height: '100%', width: '100%', minHeight: 300 }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' />
          {location && <>
            <MapCenterer lat={location.lat} lon={location.lon} />
            <Marker position={[location.lat, location.lon]} icon={userIcon()}>
              <Popup>
                <strong style={{ color: '#f0f4ff' }}>📍 Your Location</strong><br/>
                <span style={{ color: '#8892a4', fontSize: 12 }}>{location.lat.toFixed(5)}, {location.lon.toFixed(5)}</span>
              </Popup>
            </Marker>
            <Circle center={[location.lat, location.lon]} radius={5000}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.04, weight: 1.5, dashArray: '6,5' }} />
          </>}
          {visible.map((svc, i) => svc.lat && svc.lon && (
            <Marker key={i} position={[svc.lat, svc.lon]} icon={createCategoryIcon(svc.category)}>
              <Popup>
                <div style={{ minWidth: 190 }}>
                  <strong style={{ color: '#f0f4ff', fontSize: 13 }}>{CAT_ICONS[svc.category]} {svc.name}</strong><br/>
                  {svc.address && <><span style={{ color: '#8892a4', fontSize: 11 }}>{svc.address}</span><br/></>}
                  {svc.phone && svc.phone !== 'N/A' && (
                    <a href={`tel:${svc.phone}`} style={{ color: '#ef4444', fontWeight: 700, fontSize: 13, display: 'inline-block', marginTop: 4 }}>📞 {svc.phone}</a>
                  )}
                  {svc.approx_dist_m && <><br/><span style={{ color: '#4e5a6e', fontSize: 11 }}>{Math.round(svc.approx_dist_m)}m away</span></>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Action Buttons */}
        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => { if (location) { /* handle via re-render of MapCenterer */ } }}
            style={{
              width: 50, height: 50, borderRadius: 16, background: '#ef4444', border: 'none',
              boxShadow: '0 8px 24px rgba(239,68,68,0.4)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Navigation size={22} fill="white" />
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
