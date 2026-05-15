import React from 'react';
import { Phone, MapPin, Clock, Star, Navigation } from 'lucide-react';

const CAT_CONFIG = {
  hospital:  { color: 'text-red-400',    bg: 'bg-red-950',    icon: '🏥', label: 'Hospital' },
  ambulance: { color: 'text-orange-400', bg: 'bg-orange-950', icon: '🚑', label: 'Ambulance' },
  police:    { color: 'text-blue-400',   bg: 'bg-blue-950',   icon: '👮', label: 'Police' },
  towing:    { color: 'text-purple-400', bg: 'bg-purple-950', icon: '🔧', label: 'Towing' },
  puncture:  { color: 'text-green-400',  bg: 'bg-green-950',  icon: '🔩', label: 'Puncture' },
};

function formatDist(m) {
  if (!m) return null;
  return m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function estimateETA(m) {
  if (!m) return null;
  const mins = Math.round(m / 500); // ~30 km/h
  return mins <= 1 ? '< 1 min' : `~${mins} min`;
}

export default function ServiceCard({ service, rank, category }) {
  const cfg = CAT_CONFIG[category] || CAT_CONFIG.hospital;
  const dist = formatDist(service.approx_dist_m);
  const eta = estimateETA(service.approx_dist_m);
  const phone = service.phone && service.phone !== 'N/A' ? service.phone : null;

  const handleCall = (e) => {
    e.preventDefault();
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleNavigate = () => {
    if (service.lat && service.lon) {
      window.open(`https://maps.google.com/?daddr=${service.lat},${service.lon}`, '_blank');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-3 transition-all hover:border-gray-600">
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
          <span className={`text-sm font-bold ${cfg.color}`}>{rank}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span>{cfg.icon}</span>
            <h3 className="text-white font-semibold text-sm truncate">{service.name || cfg.label}</h3>
            {service.is_24x7 && (
              <span className="flex items-center gap-0.5 bg-green-900 text-green-300 text-xs px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
                <Clock size={10}/> 24x7
              </span>
            )}
          </div>

          {service.address && (
            <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
              <MapPin size={11}/> <span className="truncate">{service.address}</span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-1.5">
            {dist && (
              <span className="text-yellow-400 text-xs font-medium">{dist}</span>
            )}
            {eta && (
              <span className="text-gray-400 text-xs">ETA {eta}</span>
            )}
            {service.trauma_ready && (
              <span className="text-red-400 text-xs font-semibold">🩺 Trauma</span>
            )}
            {service.confidence_score && (
              <span className="flex items-center gap-0.5 text-gray-500 text-xs">
                <Star size={10}/> {(service.confidence_score * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        {phone ? (
          <button onClick={handleCall}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            <Phone size={15}/> {phone}
          </button>
        ) : (
          <button disabled className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 text-gray-500 rounded-xl py-2.5 text-sm cursor-not-allowed">
            <Phone size={15}/> No number listed
          </button>
        )}
        {service.lat && service.lon && (
          <button onClick={handleNavigate}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm transition-colors">
            <Navigation size={15}/>
          </button>
        )}
      </div>
    </div>
  );
}
