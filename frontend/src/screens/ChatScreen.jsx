import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Phone } from 'lucide-react';
import { VoiceInput, TriageBadge } from '../components';
import { useTriage } from '../hooks/useTriage';
import { useGeolocation } from '../hooks/useGeolocation';
import { queryNearest, queryNearestOnline } from '../services/spatialQuery';

const FIRST_AID = {
  CRITICAL: [
    'Apply firm, continuous pressure to all bleeding wounds',
    'Check breathing - if absent, begin CPR (30 compressions : 2 breaths)',
    'Do NOT move the victim unless fire or traffic hazard',
    'Stay on line with emergency dispatch until help arrives',
  ],
  MODERATE: [
    'Keep the person still, warm and calm',
    'No food, water, or medication until paramedics arrive',
    'If in shock - cover with jacket or blanket',
    'Check breathing every 2 minutes',
  ],
  MINOR: [
    'Move the person away from traffic',
    'Offer water if conscious and not injured around mouth',
    'Collect vehicle numbers and witness contacts',
  ],
};

const BOT_INTRO = {
  role: 'bot',
  text: "I'm RoadSoS AI - describe what happened and I'll assess severity, find nearest emergency services, and give you step-by-step first aid guidance.",
  time: new Date(),
};

const QUICK_PROMPTS = [
  { label: 'Car accident', text: 'There has been a car accident on the highway' },
  { label: 'Injured person', text: 'Someone is injured and bleeding heavily' },
  { label: 'Chest pain', text: 'Person has severe chest pain and difficulty breathing' },
  { label: 'Breakdown', text: 'My vehicle broke down and I need towing' },
];

export default function ChatScreen() {
  const { location } = useGeolocation();
  const { classify } = useTriage();
  const [messages, setMessages] = useState([BOT_INTRO]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [isOnline] = useState(navigator.onLine);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setShowPrompts(false);
    const userMsg = { role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const result = await classify(text);
      let foundHospitals = [];
      let foundAmbulances = [];

      if (location) {
        const hSearch = isOnline 
          ? await queryNearestOnline('hospital', location.lat, location.lon, 8000, 2)
          : await queryNearest('hospital', location.lat, location.lon, 2);
        const aSearch = isOnline 
          ? await queryNearestOnline('ambulance', location.lat, location.lon, 15000, 2)
          : await queryNearest('ambulance', location.lat, location.lon, 2);
        foundHospitals = hSearch || [];
        foundAmbulances = aSearch || [];
      }

      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Based on your description, this situation appears to be **${result?.severity || 'MODERATE'}**.`,
        severity: result?.severity,
        firstAid: FIRST_AID[result?.severity || 'MODERATE'],
        hospitals: foundHospitals,
        ambulances: foundAmbulances,
        time: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Could not process your message. Please call 108 immediately.',
        time: new Date(),
      }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-base)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(13,17,23,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, #ef4444, #991b1b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={22} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 15 }}>RoadSoS AI</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="status-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ color: '#4ade80', fontSize: 11 }}>Active</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['108', '100'].map(num => (
            <a key={num} href={`tel:${num}`} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 10, color: '#fff', fontSize: 12, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>{num}</a>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10 }}>
            <div style={{ maxWidth: '85%', background: msg.role === 'bot' ? 'rgba(26,32,53,0.95)' : '#ef4444', padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              {msg.severity && <div style={{ marginBottom: 8 }}><TriageBadge severity={msg.severity} compact /></div>}
              <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.5 }}>{msg.text}</p>
              
              {msg.firstAid && (
                <div style={{ marginTop: 10, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>FIRST AID</p>
                  {msg.firstAid.map((s, idx) => <p key={idx} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>- {s}</p>)}
                </div>
              )}

              {msg.hospitals && msg.hospitals.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', marginBottom: 4 }}>NEARBY</p>
                  {msg.hospitals.map((h, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#f0f4ff' }}>{h.name}</span>
                      <a href={`tel:${h.phone || '108'}`} style={{ color: '#60a5fa' }}><Phone size={12} /></a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>AI is thinking...</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px', background: 'var(--bg-base)', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'fixed', bottom: 64, left: 0, right: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input-field" style={{ flex: 1, borderRadius: 12, padding: '12px' }} placeholder="Describe the emergency..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage(input)} />
          <button onClick={() => sendMessage(input)} style={{ background: '#ef4444', border: 'none', borderRadius: 12, padding: '0 15px', color: '#fff' }}>Send</button>
        </div>
      </div>
    </div>
  );
}
