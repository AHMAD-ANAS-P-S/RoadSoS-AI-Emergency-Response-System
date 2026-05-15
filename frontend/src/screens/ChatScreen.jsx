import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User, Mic } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import TriageBadge from '../components/TriageBadge';
import { useTriage } from '../hooks/useTriage';
import { useGeolocation } from '../hooks/useGeolocation';
import { queryNearest, queryNearestOnline } from '../services/spatialQuery';

const FIRST_AID = {
  CRITICAL: [
    '🩸 Apply firm pressure to any bleeding wounds with a clean cloth',
    '🫁 Check if person is breathing — if not, start CPR (30 compressions, 2 breaths)',
    '🚫 Do NOT move the person unless in immediate danger of fire/traffic',
    '📞 Keep talking to the person to maintain consciousness',
  ],
  MODERATE: [
    '🧊 Keep the person still and calm',
    '💊 Do not give food, water, or medication',
    '🌡️ Keep warm if in shock — use jacket or blanket',
    '👁️ Monitor breathing every 2 minutes',
  ],
  MINOR: [
    '🪑 Seat the person away from traffic',
    '💧 Offer water if conscious and not injured around mouth',
    '📋 Collect vehicle and witness details for report',
  ],
};

const BOT_INTRO = {
  role: 'bot',
  text: '👋 I am RoadSoS AI. Describe what happened and I will find the right emergency services for you. You can type or speak.',
  time: new Date(),
};

export default function ChatScreen() {
  const { t } = useTranslation();
  const { location } = useGeolocation();
  const { classify, severity } = useTriage();
  const [messages, setMessages] = useState([BOT_INTRO]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      // Step 1: Classify severity
      const result = await classify(text);

      // Step 2: Fetch nearest services if location available
      let servicesText = '';
      if (location) {
        const hospitals = navigator.onLine
          ? await queryNearestOnline('hospital', location.lat, location.lon, 5000, 3)
          : await queryNearest('hospital', location.lat, location.lon, 3);
        const ambulances = navigator.onLine
          ? await queryNearestOnline('ambulance', location.lat, location.lon, 5000, 3)
          : await queryNearest('ambulance', location.lat, location.lon, 3);

        if (hospitals.length > 0) {
          servicesText += `\n\n🏥 **Nearest Hospitals:**\n${hospitals.slice(0,2).map((h,i) =>
            `${i+1}. ${h.name} — ${h.approx_dist_m ? Math.round(h.approx_dist_m)+'m' : 'nearby'} — 📞 ${h.phone||'N/A'}`
          ).join('\n')}`;
        }
        if (ambulances.length > 0) {
          servicesText += `\n\n🚑 **Ambulance Services:**\n${ambulances.slice(0,2).map((a,i) =>
            `${i+1}. ${a.name} — 📞 ${a.phone||'108'}`
          ).join('\n')}`;
        }
      }

      // Step 3: First aid guidance
      const firstAidSteps = FIRST_AID[result?.severity || 'MODERATE'];
      const firstAidText = `\n\n🩺 **Immediate First Aid:**\n${firstAidSteps.join('\n')}`;

      const severity_labels = {
        CRITICAL: '🔴 CRITICAL — Call ambulance immediately!',
        MODERATE: '🟡 MODERATE — Seek medical attention soon',
        MINOR: '🟢 MINOR — Monitor and assist',
      };

      const botReply = `**Severity: ${severity_labels[result?.severity || 'MODERATE']}**
**Intent: ${result?.intent || 'accident'}**${servicesText}${firstAidText}

💡 Tip: Press the big SOS button on the home screen to auto-call the nearest facility and alert your emergency contacts.`;

      setMessages(prev => [...prev, { role: 'bot', text: botReply, severity: result?.severity, time: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '⚠️ Could not process your message. Please call 108 (ambulance) or 100 (police) directly.',
        time: new Date()
      }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex items-center gap-3">
        <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center">
          <Bot size={20} className="text-white"/>
        </div>
        <div>
          <p className="text-white font-bold text-sm">RoadSoS AI Assistant</p>
          <p className="text-green-400 text-xs">● Online · AI Triage Active</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot size={14} className="text-white"/>
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap
              ${msg.role === 'user'
                ? 'bg-red-600 text-white rounded-tr-sm'
                : 'bg-gray-800 text-gray-100 rounded-tl-sm'}`}>
              {msg.severity && <TriageBadge severity={msg.severity} compact />}
              {msg.text.replace(/\*\*/g, '')}
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-red-200' : 'text-gray-500'}`}>
                {msg.time?.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                <User size={14} className="text-white"/>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center">
              <Bot size={14} className="text-white animate-pulse"/>
            </div>
            <span className="animate-pulse">Analyzing emergency...</span>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-red-500"
            placeholder="Describe what happened..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          />
          <VoiceInput onResult={(t) => { setInput(t); sendMessage(t); }} />
          <button
            onClick={() => sendMessage(input)}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 transition-colors"
          >
            <Send size={18}/>
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-1.5 text-center">
          Emergency? Call 108 (Ambulance) · 100 (Police) · 112 (Universal)
        </p>
      </div>
    </div>
  );
}
