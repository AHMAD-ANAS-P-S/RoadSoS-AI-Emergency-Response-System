// VoiceInput.jsx
import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

export function VoiceInput({ onResult }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = React.useRef(null);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      setSupported(true);
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        onResult?.(transcript);
        setListening(false);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recRef.current = rec;

      // Continuous background listener for "RoadSoS help"
      const bgRec = new SpeechRec();
      bgRec.continuous = true;
      bgRec.onresult = (e) => {
        const t = e.results[e.results.length-1][0].transcript.toLowerCase();
        if (t.includes('roadsos') || t.includes('road sos')) {
          onResult?.('accident help needed');
        }
      };
      try { bgRec.start(); } catch(e) {}
    }
  }, []);

  const toggle = () => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); }
    else { recRef.current.start(); setListening(true); }
  };

  if (!supported) return null;
  return (
    <button onClick={toggle}
      className={`p-3 rounded-xl transition-colors ${listening ? 'bg-red-600 animate-pulse' : 'bg-gray-800 hover:bg-gray-700'}`}
      title={listening ? 'Stop listening' : 'Voice input'}>
      {listening ? <Mic size={18} className="text-white"/> : <MicOff size={18} className="text-gray-400"/>}
    </button>
  );
}

// TriageBadge.jsx
export function TriageBadge({ severity, compact }) {
  if (!severity) return null;
  const config = {
    CRITICAL: { bg:'bg-red-600', text:'🔴 CRITICAL', desc:'Call ambulance immediately' },
    MODERATE: { bg:'bg-yellow-600', text:'🟡 MODERATE', desc:'Seek medical attention' },
    MINOR:    { bg:'bg-green-600', text:'🟢 MINOR', desc:'Monitor situation' },
  };
  const c = config[severity] || config.MODERATE;
  return (
    <div className={`${c.bg} rounded-xl px-3 py-1.5 ${compact ? 'inline-flex' : 'flex'} items-center gap-2 mb-1`}>
      <span className="text-white font-bold text-xs">{c.text}</span>
      {!compact && <span className="text-white/80 text-xs">— {c.desc}</span>}
    </div>
  );
}

// BottomNav.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Map, MessageCircle, Settings } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const loc = useLocation();
  const tabs = [
    { path:'/sos',      icon:AlertTriangle, label:'SOS' },
    { path:'/map',      icon:Map,           label:'Map' },
    { path:'/chat',     icon:MessageCircle, label:'AI Chat' },
    { path:'/settings', icon:Settings,      label:'Settings' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-50">
      {tabs.map(tab => {
        const active = loc.pathname === tab.path;
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors
              ${active ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <tab.icon size={20}/>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default VoiceInput;
