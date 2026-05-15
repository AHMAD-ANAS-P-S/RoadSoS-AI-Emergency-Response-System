import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './services/i18n';
import SOSScreen from './screens/SOSScreen';
import MapScreen from './screens/MapScreen';
import ChatScreen from './screens/ChatScreen';
import SettingsScreen from './screens/SettingsScreen';
import BottomNav from './components/BottomNav';
import { initOfflineDB } from './services/spatialQuery';
import './index.css';

function App() {
  useEffect(() => {
    // Initialize offline database on app load
    initOfflineDB().catch(console.error);

    // Register service worker for PWA offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.error('SW failed:', err));
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white relative">
          <Suspense fallback={<div className="flex items-center justify-center h-screen text-red-500 text-2xl font-bold">🚑 RoadSoS Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/sos" replace />} />
              <Route path="/sos" element={<SOSScreen />} />
              <Route path="/map" element={<MapScreen />} />
              <Route path="/chat" element={<ChatScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </Suspense>
          <BottomNav />
        </div>
      </Router>
    </I18nextProvider>
  );
}

export default App;
