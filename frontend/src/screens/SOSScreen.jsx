import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, MapPin, Wifi, WifiOff, AlertCircle, Navigation } from 'lucide-react';
import SOSButton from '../components/SOSButton';
import ServiceCard from '../components/ServiceCard';
import TriageBadge from '../components/TriageBadge';
import VoiceInput from '../components/VoiceInput';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTriage } from '../hooks/useTriage';
import { queryNearest, queryNearestOnline } from '../services/spatialQuery';
import { sendSOS } from '../services/sosAlert';

const CATEGORIES = ['hospital', 'ambulance', 'police', 'towing', 'puncture'];

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Triple-press detection
  useEffect(() => {
    let presses = 0;
    let timer = null;
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

  const fetchServices = useCallback(async (lat, lon) => {
    setLoading(true);
    setFetchError(null);
    try {
      const results = {};
      for (const cat of CATEGORIES) {
        results[cat] = isOnline
          ? await queryNearestOnline(cat, lat, lon)
          : await queryNearest(cat, lat, lon);
      }
      setServices(results);
    } catch (err) {
      setFetchError(t('error.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [isOnline, t]);

  useEffect(() => {
    if (location) fetchServices(location.lat, location.lon);
  }, [location, fetchServices]);

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
    if (transcript.toLowerCase().includes('roadsos') ||
        transcript.toLowerCase().includes('help') ||
        transcript.toLowerCase().includes('accident')) {
      const result = await classify(transcript);
      if (location) fetchServices(location.lat, location.lon);
    }
  }, [classify, location, fetchServices]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-red-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">🚑 RoadSoS</h1>
          <p className="text-red-200 text-xs">{t('header.tagline')}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline
            ? <span className="flex items-center gap-1 text-green-300 text-xs"><Wifi size={14}/> Online</span>
            : <span className="flex items-center gap-1 text-yellow-300 text-xs"><WifiOff size={14}/> Offline</span>
          }
        </div>
      </div>

      {/* Triage + Input */}
      <div className="px-4 py-3 bg-gray-900">
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-red-500"
            placeholder={t('sos.inputPlaceholder')}
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && classify(userInput)}
          />
          <VoiceInput onResult={handleVoiceResult} />
        </div>
        {severity && <TriageBadge severity={severity} />}
        {locError && (
          <div className="flex items-center gap-2 text-yellow-400 text-xs mt-2">
            <AlertCircle size={14}/> {t('error.locationFailed')}
          </div>
        )}
      </div>

      {/* SOS Button */}
      <div className="flex justify-center py-6 bg-gray-950">
        <SOSButton
          onTrigger={handleSOSTrigger}
          triggered={sosTriggered}
          disabled={!location || locLoading}
        />
      </div>

      {/* Location info */}
      {location && (
        <div className="px-4 flex items-center gap-2 text-gray-400 text-xs mb-3">
          <MapPin size={14} className="text-red-500"/>
          {t('sos.locationDetected')}: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
          {location.address && <span className="text-gray-500"> · {location.address}</span>}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
              ${activeCat === cat ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {t(`category.${cat}`)} {services[cat]?.length > 0 && `(${services[cat].length})`}
          </button>
        ))}
      </div>

      {/* Service Cards */}
      <div className="px-4 flex-1 mt-2">
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <span className="animate-spin mr-2">⏳</span> {t('sos.searching')}
          </div>
        )}
        {!loading && fetchError && (
          <div className="text-red-400 text-sm text-center py-4">{fetchError}</div>
        )}
        {!loading && !fetchError && (services[activeCat] || []).map((svc, i) => (
          <ServiceCard key={i} service={svc} rank={i + 1} category={activeCat} />
        ))}
        {!loading && !fetchError && location && (services[activeCat] || []).length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">{t('sos.noResults')}</div>
        )}
        {!location && !locLoading && (
          <div className="text-center py-10">
            <Navigation size={32} className="text-red-500 mx-auto mb-3"/>
            <p className="text-gray-400 text-sm">{t('sos.enableLocation')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
