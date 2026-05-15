import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertTriangle, Map, MessageCircle, Settings, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── VoiceInput ──────────────────────────────────────────────
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

      const bgRec = new SpeechRec();
      bgRec.continuous = true;
      bgRec.onresult = (e) => {
        const t = e.results[e.results.length - 1][0].transcript.toLowerCase();
        if (t.includes('roadsos') || t.includes('road sos')) {
          onResult?.('accident help needed');
        }
      };
      try { bgRec.start(); } catch (e) {}
    }
  }, []);

  const toggle = () => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); }
    else { recRef.current.start(); setListening(true); }
  };

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      title={listening ? 'Stop listening' : 'Voice input'}
      style={{
        background: listening
          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
          : 'rgba(255,255,255,0.06)',
        border: listening ? 'none' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.25s',
        minHeight: '48px',
        minWidth: '48px',
        boxShadow: listening ? '0 4px 20px rgba(239,68,68,0.4)' : 'none',
        animation: listening ? 'sos-pulse 1s ease-in-out infinite' : 'none',
      }}
    >
      {listening
        ? <Mic size={18} color="#fff" />
        : <MicOff size={18} color="rgba(255,255,255,0.5)" />}
    </button>
  );
}

// ─── TriageBadge ─────────────────────────────────────────────
export function TriageBadge({ severity, compact }) {
  if (!severity) return null;

  const config = {
    CRITICAL: {
      bg: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      shadow: 'triage-critical',
      dot: '#fca5a5',
      text: 'CRITICAL',
      desc: 'Call ambulance immediately',
      emoji: '🔴',
    },
    MODERATE: {
      bg: 'linear-gradient(135deg, #d97706, #b45309)',
      shadow: 'triage-moderate',
      dot: '#fde68a',
      text: 'MODERATE',
      desc: 'Seek medical attention',
      emoji: '🟡',
    },
    MINOR: {
      bg: 'linear-gradient(135deg, #16a34a, #15803d)',
      shadow: 'triage-minor',
      dot: '#86efac',
      text: 'MINOR',
      desc: 'Monitor situation',
      emoji: '🟢',
    },
  };

  const c = config[severity] || config.MODERATE;

  return (
    <div
      className={c.shadow}
      style={{
        display: compact ? 'inline-flex' : 'flex',
        alignItems: 'center',
        gap: '8px',
        background: c.bg,
        borderRadius: '10px',
        padding: compact ? '4px 10px' : '8px 14px',
        marginBottom: compact ? 0 : '6px',
        fontSize: compact ? '11px' : '12px',
        fontWeight: 700,
        letterSpacing: '0.05em',
      }}
    >
      <span>{c.emoji}</span>
      <span style={{ color: '#fff' }}>{c.text}</span>
      {!compact && (
        <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>— {c.desc}</span>
      )}
    </div>
  );
}

// ─── BottomNav ───────────────────────────────────────────────
export function BottomNav() {
  const navigate = useNavigate();
  const loc = useLocation();

  const tabs = [
    { path: '/sos',      icon: AlertTriangle, label: 'SOS',      color: '#ef4444' },
    { path: '/map',      icon: Map,           label: 'Map',      color: '#3b82f6' },
    { path: '/chat',     icon: MessageCircle, label: 'AI Chat',  color: '#8b5cf6' },
    { path: '/settings', icon: Settings,      label: 'Settings', color: '#6b7280' },
  ];

  return (
    <div
      className="bottom-nav-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map((tab) => {
        const active = loc.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px 4px 12px',
              gap: '3px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minHeight: 'auto',
              position: 'relative',
            }}
          >
            {/* Active indicator dot */}
            {active && (
              <div style={{
                position: 'absolute',
                top: 6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: `${tab.color}18`,
                border: `1px solid ${tab.color}30`,
              }} />
            )}
            <Icon
              size={22}
              style={{
                color: active ? tab.color : 'rgba(255,255,255,0.3)',
                transition: 'color 0.2s, transform 0.2s',
                transform: active ? 'scale(1.1)' : 'scale(1)',
                position: 'relative',
              }}
            />
            <span style={{
              fontSize: '10px',
              fontWeight: active ? 700 : 400,
              color: active ? tab.color : 'rgba(255,255,255,0.3)',
              letterSpacing: '0.02em',
              transition: 'all 0.2s',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default VoiceInput;
