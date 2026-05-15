import React from 'react';
import { Phone, MapPin, Clock, Navigation, Star, Zap } from 'lucide-react';

const CAT_CONFIG = {
  hospital:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)',    icon: '🏥', label: 'Hospital' },
  ambulance: { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.2)',   icon: '🚑', label: 'Ambulance' },
  police:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.2)',   icon: '👮', label: 'Police' },
  towing:    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.2)',   icon: '🔧', label: 'Towing' },
  puncture:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.2)',   icon: '🔩', label: 'Puncture Shop' },
};

function formatDist(m) {
  if (!m) return null;
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function estimateETA(m) {
  if (!m) return null;
  const mins = Math.round(m / 500);
  return mins <= 1 ? '< 1 min' : `~${mins} min`;
}

export default function ServiceCard({ service, rank, category }) {
  const cfg = CAT_CONFIG[category] || CAT_CONFIG.hospital;
  const dist = formatDist(service.approx_dist_m);
  const eta = estimateETA(service.approx_dist_m);
  const phone = service.phone && service.phone !== 'N/A' ? service.phone : null;

  const handleCall = () => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleNavigate = () => {
    if (service.lat && service.lon) {
      window.open(`https://maps.google.com/?daddr=${service.lat},${service.lon}`, '_blank');
    }
  };

  return (
    <div
      className="service-card slide-up"
      style={{
        background: 'linear-gradient(135deg, rgba(26,32,53,0.9) 0%, rgba(16,20,30,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: '16px',
        marginBottom: 12,
        borderTop: `1px solid rgba(255,255,255,0.08)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Rank badge */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 18,
        }}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{
              color: '#f0f4ff',
              fontWeight: 700,
              fontSize: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {service.name || cfg.label}
            </h3>

            {/* Rank */}
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: cfg.color,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: 6,
              padding: '2px 7px',
              flexShrink: 0,
              letterSpacing: '0.04em',
            }}>
              #{rank}
            </span>
          </div>

          {/* Address */}
          {service.address && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: 'rgba(255,255,255,0.35)',
              fontSize: 12,
              marginBottom: 8,
              overflow: 'hidden',
            }}>
              <MapPin size={11} color="rgba(255,255,255,0.35)" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {service.address}
              </span>
            </div>
          )}

          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {dist && (
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: cfg.color,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <MapPin size={11} />
                {dist}
              </span>
            )}
            {eta && (
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}>
                <Zap size={10} />
                ETA {eta}
              </span>
            )}
            {service.is_24x7 ? (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#4ade80',
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 6,
                padding: '2px 7px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <Clock size={9} />
                24×7
              </span>
            ) : null}
            {service.trauma_ready ? (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#f87171',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 6,
                padding: '2px 7px',
              }}>
                🩺 Trauma
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {phone ? (
          <button
            onClick={handleCall}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none',
              borderRadius: 14,
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              padding: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(239,68,68,0.3)'}
          >
            <Phone size={15} />
            {phone}
          </button>
        ) : (
          <button disabled style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            color: 'rgba(255,255,255,0.25)',
            fontSize: 13,
            padding: '12px',
            cursor: 'not-allowed',
          }}>
            <Phone size={15} />
            No number listed
          </button>
        )}
        {service.lat && service.lon && (
          <button
            onClick={handleNavigate}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 16px',
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 14,
              color: '#60a5fa',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Get Directions"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
          >
            <Navigation size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
