import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, MapPin, Wifi, WifiOff, AlertCircle, Navigation, Shield, Activity } from 'lucide-react';
import SOSButton from '../components/SOSButton';
import ServiceCard from '../components/ServiceCard';
import { TriageBadge, VoiceInput } from '../components';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTriage } from '../hooks/useTriage';
import { queryNearest, queryNearestOnline } from '../services/spatialQuery';
import { sendSOS } from '../services/sosAlert';

const CATEGORIES = [
  { id: 'hospital',  icon: '🏥', label: 'Hospital',  color: '#ef4444' },
  { id: 'ambulance', icon: '🚑', label: 'Ambulance', color: '#f97316' },
  { id: 'police',    icon: '👮', label: 'Police',    color: '#3b82f6' },
  { id: 'towing',    icon: '🔧', label: 'Towing',    color: '#8b5cf6' },
  { id: 'puncture',  icon: '🔩', label: 'Puncture',  color: '#10b981' },
];

const EMERGENCY_NUMBERS = [
  { num: '108', label: 'Ambulance', color: '#ef4444' },
  { num: '100', label: 'Police',    color: '#3b82f6' },
  { num: '112', label: 'Universal', color: '#8b5cf6' },
  { num: '101', label: 'Fire',      color: '#f97316' },
];

export default function SOSScreen() {
  const { t } = useTranslation();
  const { location, error: locError, loading: locLoading } = useGeolocation();
  const { classify, severity, isLoading: triageLoading } = useTriage();

  const [services, setServices] = useState({});
  const [activeCat, setActiveCat] = useState('hospital');
  const [userInput, setUserInput] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [loadingCats, setLoadingCats] = useState(new Set());
  const [loadedCats, setLoadedCats] = useState(new Set()); // tracks which cats are already fetched

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    let presses = 0, timer = null;
    const handleKey = (e) => {
      if (e.key === 'VolumeDown' || e.key === 'F9') {
        presses++;
        clearTimeout(timer);
        timer = setTimeout(() => { presses = 0; }, 2000);
        if (presses >= 3) { handleSOSTrigger(); presses = 0; }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [location]);

  // Fetch a SINGLE category on demand, with results cache
  const fetchCategory = useCallback(async (cat, lat, lon, force = false) => {
    if (!lat || !lon) return;
    if (!force && loadedCats.has(cat)) return; // already loaded, skip

    setLoadingCats(prev => new Set(prev).add(cat));
    setFetchError(null);

    const safetyTimer = setTimeout(() => {
      setLoadingCats(prev => {
        const next = new Set(prev);
        next.delete(cat);
        return next;
      });
    }, 9000);

    try {
      const results = isOnline
        ? await queryNearestOnline(cat, lat, lon)
        : await queryNearest(cat, lat, lon);

      setServices(prev => ({ ...prev, [cat]: results }));
      setLoadedCats(prev => new Set(prev).add(cat));
    } catch (err) {
      setFetchError(`Could not load ${cat} services`);
    } finally {
      clearTimeout(safetyTimer);
      setLoadingCats(prev => {
        const next = new Set(prev);
        next.delete(cat);
        return next;
      });
    }
  }, [isOnline, loadedCats]);

  // When location first arrives, fetch the default tab (hospital)
  useEffect(() => {
    if (location) {
      setLoadedCats(new Set()); // clear cache on location change
      setServices({});
      fetchCategory('hospital', location.lat, location.lon, true);
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  // When active tab changes, fetch that category if not yet loaded
  useEffect(() => {
    if (location) fetchCategory(activeCat, location.lat, location.lon);
  }, [activeCat, location]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleSOSTrigger = useCallback(async () => {
    if (!location) return;
    setSosTriggered(true);
    const triage = userInput ? await classify(userInput) : null;
    const nearestHospital = services.hospital?.[0];
    await sendSOS(location, nearestHospital, triage);
    setTimeout(() => setSosTriggered(false), 5000);
  }, [location, services, userInput, classify]);

  const handleVoiceResult = useCallback(async (transcript) => {
    setUserInput(transcript);
    await classify(transcript);
    if (location) fetchCategory(activeCat, location.lat, location.lon, true);
  }, [classify, location, activeCat, fetchCategory]);

  const activeCatConfig = CATEGORIES.find(c => c.id === activeCat);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      paddingBottom: 80,
    }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(185,28,28,0.95) 0%, rgba(127,29,29,0.9) 100%)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}>🚑</div>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 24,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              RoadSoS
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 4, fontWeight: 500, letterSpacing: '0.02em' }}>
            AI-Powered Emergency Response System
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isOnline ? 'rgba(74,222,128,0.15)' : 'rgba(250,204,21,0.15)',
            border: `1px solid ${isOnline ? 'rgba(74,222,128,0.3)' : 'rgba(250,204,21,0.3)'}`,
            borderRadius: 20,
            padding: '4px 10px',
          }}>
            {isOnline
              ? <><Wifi size={12} color="#4ade80" /><span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600 }}>Online</span></>
              : <><WifiOff size={12} color="#fde047" /><span style={{ color: '#fde047', fontSize: 11, fontWeight: 600 }}>Offline</span></>
            }
          </div>
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
              <MapPin size={9} color={location.source === 'ip' ? '#fde047' : '#4ade80'} />
              <span style={{ color: location.source === 'ip' ? '#fde047' : 'rgba(255,255,255,0.5)' }}>
                {location.address
                  ? location.address.split(',')[0]
                  : `${location.lat.toFixed(3)}, ${location.lon.toFixed(3)}`}
                {location.source === 'ip' && ' (approx)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Emergency Quick Dial ──────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 8 }}>
        {EMERGENCY_NUMBERS.map(en => (
          <a
            key={en.num}
            href={`tel:${en.num}`}
            className="emergency-chip"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              borderRadius: 12,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 15, color: en.color }}>{en.num}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 1, fontWeight: 500 }}>{en.label}</span>
          </a>
        ))}
      </div>

      {/* ── Triage Input ──────────────────────────────────────── */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18,
          padding: '12px 14px',
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🧠 Describe the emergency
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input-field"
              style={{
                flex: 1,
                borderRadius: 12,
                padding: '11px 16px',
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
              }}
              placeholder="e.g. car accident, person unconscious..."
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && userInput.trim() && classify(userInput)}
            />
            <VoiceInput onResult={handleVoiceResult} />
          </div>

          {/* Triage result */}
          {triageLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              <Activity size={12} style={{ animation: 'status-pulse 1s ease-in-out infinite' }} />
              Analyzing severity…
            </div>
          )}
          {severity && !triageLoading && (
            <div style={{ marginTop: 8 }}>
              <TriageBadge severity={severity} />
            </div>
          )}

          {/* Only show location warning when we have NO location at all */}
          {locError && !location && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(250,204,21,0.08)',
              border: '1px solid rgba(250,204,21,0.2)',
              color: '#fde047',
              fontSize: 12,
            }}>
              <AlertCircle size={13} />
              <span>Location access needed — please allow GPS in your browser to find nearby services</span>
            </div>
          )}
        </div>
      </div>

      {/* ── SOS Button ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px 20px' }}>
        <SOSButton
          onTrigger={handleSOSTrigger}
          triggered={sosTriggered}
          disabled={!location || locLoading}
        />
      </div>

      {/* ── Category Tabs ─────────────────────────────────────── */}
      <div style={{
        padding: '0 16px 12px',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCat === cat.id;
          const isLoading = loadingCats.has(cat.id);
          const count = (services[cat.id] || []).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                flexShrink: 0,
                padding: '7px 16px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s',
                background: isActive
                  ? `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                boxShadow: isActive ? `0 4px 14px ${cat.color}40` : 'none',
                transform: isActive ? 'translateY(-1px)' : 'none',
              }}
            >
              {isLoading ? (
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <span style={{ fontSize: 14 }}>{cat.icon}</span>
              )}
              {cat.label}
              {!isLoading && count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: '0 6px',
                  fontSize: 10,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Service List ──────────────────────────────────────── */}
      <div style={{ padding: '0 16px', flex: 1 }}>
        {/* Loading shimmer */}
        {loadingCats.has(activeCat) && (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="shimmer" style={{ height: 110, marginBottom: 12, borderRadius: 20 }} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loadingCats.has(activeCat) && fetchError && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 16,
            padding: '16px',
            textAlign: 'center',
            color: '#fca5a5',
            fontSize: 13,
          }}>
            ⚠️ {fetchError}
          </div>
        )}

        {/* Service cards */}
        {!loadingCats.has(activeCat) && !fetchError && (services[activeCat] || []).map((svc, i) => (
          <ServiceCard key={i} service={svc} rank={i + 1} category={activeCat} />
        ))}

        {/* No results — only show when we KNOW the fetch completed */}
        {!loadingCats.has(activeCat) && !fetchError && location && loadedCats.has(activeCat) && (services[activeCat] || []).length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '32px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>
              {CATEGORIES.find(c => c.id === activeCat)?.icon}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              No {activeCat} services found nearby
            </p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginBottom: 16 }}>
              Searched 15km radius — try calling national helplines
            </p>
            <button
              onClick={() => fetchCategory(activeCat, location.lat, location.lon, true)}
              style={{
                padding: '8px 20px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              🔄 Retry Search
            </button>
          </div>
        )}


        {/* Location required */}
        {!location && !locLoading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Navigation size={32} color="#ef4444" />
            </div>
            <p style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              Location Required
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6 }}>
              Allow location access to find nearby emergency services and activate the SOS button
            </p>
          </div>
        )}

        {/* Loading location */}
        {locLoading && !location && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '3px solid rgba(239,68,68,0.2)',
              borderTop: '3px solid #ef4444',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Detecting your location…</p>
          </div>
        )}
      </div>

      {/* Spin animation inline */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
