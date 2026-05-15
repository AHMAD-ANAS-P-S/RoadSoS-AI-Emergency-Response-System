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
  const [services, setServices] = useState([]);
  const [activeFilters, setActiveFilters] = useState(['hospital','ambulance','police']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    const fetchAll = async () => {
      const cats = ['hospital','ambulance','police','towing','puncture'];
      const all = [];
      for (const cat of cats) {
        const res = navigator.onLine
          ? await queryNearestOnline(cat, location.lat, location.lon, 8000, 5)
          : await queryNearest(cat, location.lat, location.lon, 5);
        res.forEach(r => r.lat && r.lon && all.push({ ...r, category: cat }));
      }
      setServices(all);
      setLoading(false);
    };
    fetchAll().catch(() => setLoading(false));
  }, [location]);

  const toggleFilter = (cat) => {
    setActiveFilters(prev => prev.includes(cat) ? prev.filter(c=>c!==cat) : [...prev, cat]);
  };

  const visible = services.filter(s => activeFilters.includes(s.category));

  return (
    <div className="flex flex-col h-screen bg-gray-950 pb-20">
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800">
        <h2 className="text-white font-bold">Emergency Map</h2>
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {Object.entries(CAT_ICONS).map(([cat, icon]) => (
            <button key={cat} onClick={() => toggleFilter(cat)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                ${activeFilters.includes(cat) ? 'text-white' : 'bg-gray-800 text-gray-500'}`}
              style={activeFilters.includes(cat) ? { background: CAT_COLORS[cat] } : {}}>
              {icon} {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full">
            Loading services...
          </div>
        )}
        <MapContainer center={location ? [location.lat, location.lon] : [13.0827, 80.2707]}
          zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' />
          {location && <>
            <MapCenterer lat={location.lat} lon={location.lon} />
            <Marker position={[location.lat, location.lon]} icon={userIcon()}>
              <Popup><strong>📍 Your Location</strong><br/>{location.lat.toFixed(5)}, {location.lon.toFixed(5)}</Popup>
            </Marker>
            <Circle center={[location.lat, location.lon]} radius={5000}
              pathOptions={{ color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.05, weight:1, dashArray:'6,4' }}/>
          </>}
          {visible.map((svc, i) => svc.lat && svc.lon && (
            <Marker key={i} position={[svc.lat, svc.lon]} icon={createCategoryIcon(svc.category)}>
              <Popup>
                <div style={{minWidth:180}}>
                  <strong>{CAT_ICONS[svc.category]} {svc.name}</strong><br/>
                  {svc.address && <><span style={{color:'#666',fontSize:12}}>{svc.address}</span><br/></>}
                  {svc.phone && svc.phone !== 'N/A' && (
                    <a href={`tel:${svc.phone}`} style={{color:'#ef4444',fontWeight:'bold'}}>📞 {svc.phone}</a>
                  )}
                  {svc.approx_dist_m && <><br/><span style={{color:'#888',fontSize:11}}>{Math.round(svc.approx_dist_m)}m away</span></>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
