import React, { useState, useEffect } from 'react';
import {
  Globe, Bell, Shield, Plus, Trash2, User, Phone,
  ChevronRight, Lock, Vibrate, Zap, Info, Heart,
  CheckCircle, AlertTriangle, Wifi, MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ── Data ───────────────────────────────────────────────────── */
const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',    flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',   flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ',    flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം',  flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা',    flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी',    flag: '🇮🇳' },
];

const HELPLINES = [
  { num: '112', label: 'Universal Emergency', icon: '🆘', color: '#8b5cf6' },
  { num: '108', label: 'Ambulance',           icon: '🚑', color: '#ef4444' },
  { num: '100', label: 'Police',              icon: '👮', color: '#3b82f6' },
  { num: '101', label: 'Fire & Rescue',       icon: '🔥', color: '#f97316' },
  { num: '1073', label: 'Road Accident',      icon: '🚗', color: '#10b981' },
  { num: '104', label: 'Medical Helpline',    icon: '🏥', color: '#06b6d4' },
];

/* ── Sub-components ─────────────────────────────────────────── */
function Toggle({ value, onChange, color = '#ef4444' }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      style={{
        width: 50, height: 28, borderRadius: 14, padding: 0,
        background: value ? color : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.25s',
        minHeight: 'auto', minWidth: 'auto', flexShrink: 0,
        boxShadow: value ? `0 4px 12px ${color}50` : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 4, left: value ? 26 : 4,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}

function SectionLabel({ text }) {
  return (
    <p style={{
      fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 8, marginTop: 4, paddingLeft: 4,
    }}>{text}</p>
  );
}

function SectionCard({ children }) {
  return (
    <div className="settings-section" style={{ padding: '6px 16px', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function SettingRow({ icon: Icon, iconColor = '#ef4444', iconBg, title, subtitle, right, onClick, noBorder }) {
  return (
    <div
      className={noBorder ? '' : 'settings-row'}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: noBorder ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: iconBg || `${iconColor}18`,
          border: `1px solid ${iconColor}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={iconColor} />
        </div>
        <div>
          <p style={{ color: '#f0f4ff', fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{title}</p>
          {subtitle && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {right || (onClick && <ChevronRight size={16} color="rgba(255,255,255,0.25)" />)}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function SettingsScreen() {
  const { i18n } = useTranslation();
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('roadsos_contacts') || '[]'); }
    catch { return []; }
  });
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [prefs, setPrefs] = useState({
    notifications: true,
    vibration: true,
    autoSOS: false,
    locationTracking: true,
  });

  useEffect(() => {
    localStorage.setItem('roadsos_contacts', JSON.stringify(contacts));
  }, [contacts]);

  const setPref = (key) => (val) => setPrefs(p => ({ ...p, [key]: val }));

  const addContact = () => {
    if (newContact.name.trim() && newContact.phone.trim()) {
      setContacts(prev => [...prev, { ...newContact, id: Date.now() }]);
      setNewContact({ name: '', phone: '' });
      setShowAddContact(false);
    }
  };

  const canAdd = newContact.name.trim() && newContact.phone.trim();

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      paddingBottom: 100,
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── Sticky Header ──────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'linear-gradient(to bottom, rgba(6,9,18,0.99) 0%, rgba(6,9,18,0.95) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        padding: '18px 20px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(127,29,29,0.3))',
            border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>⚙️</div>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 22, color: '#f0f4ff', letterSpacing: '-0.02em' }}>Settings</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 1 }}>Personalise your RoadSoS experience</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Emergency Helplines ───────────────────────────────── */}
        <SectionLabel text="Emergency Helplines — Tap to Call" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {HELPLINES.map(h => (
            <a
              key={h.num}
              href={`tel:${h.num}`}
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, rgba(26,32,53,0.92) 0%, rgba(16,20,30,0.96) 100%)',
                border: `1px solid ${h.color}22`,
                borderRadius: 16,
                padding: '12px 10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${h.color}55`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${h.color}22`; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: 20 }}>{h.icon}</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: h.color, letterSpacing: '-0.01em', fontFamily: "'Outfit', sans-serif" }}>{h.num}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.3, fontWeight: 600 }}>{h.label}</span>
            </a>
          ))}
        </div>

        {/* ── Language ─────────────────────────────────────────── */}
        <SectionLabel text="Interface Language" />
        <SectionCard>
          <div style={{ padding: '12px 0 6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {LANGUAGES.map(lang => {
                const active = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 12,
                      border: active ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                      fontWeight: active ? 700 : 400, fontSize: 13,
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                      minHeight: 'auto',
                      boxShadow: active ? '0 4px 12px rgba(59,130,246,0.2)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                    {active && <CheckCircle size={13} color="#60a5fa" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* ── Emergency Contacts ────────────────────────────────── */}
        <SectionLabel text="Emergency Contacts" />
        <SectionCard>
          {/* Existing contacts */}
          {contacts.length === 0 && !showAddContact && (
            <div style={{
              padding: '20px 0', textAlign: 'center',
              color: 'rgba(255,255,255,0.2)', fontSize: 13,
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>👤</div>
              <p>No contacts added yet</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>These will be alerted automatically on SOS</p>
            </div>
          )}

          {contacts.map((c, idx) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0',
              borderBottom: idx < contacts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(127,29,29,0.2))',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16, color: '#ef4444',
                fontFamily: "'Outfit', sans-serif",
              }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#f0f4ff', fontWeight: 600, fontSize: 14 }}>{c.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>{c.phone}</p>
              </div>
              <a
                href={`tel:${c.phone}`}
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#60a5fa', textDecoration: 'none', flexShrink: 0,
                }}
              >
                <Phone size={14} />
              </a>
              <button
                onClick={() => setContacts(prev => prev.filter(x => x.id !== c.id))}
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                  minHeight: 'auto', minWidth: 'auto',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Add contact form */}
          {showAddContact ? (
            <div style={{ padding: '12px 0', borderTop: contacts.length > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="input-field"
                  style={{ flex: 1, borderRadius: 12, padding: '11px 14px', fontSize: 13 }}
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
                <input
                  className="input-field"
                  style={{ flex: 1, borderRadius: 12, padding: '11px 14px', fontSize: 13 }}
                  placeholder="+91 number"
                  type="tel"
                  value={newContact.phone}
                  onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addContact()}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowAddContact(false); setNewContact({ name: '', phone: '' }); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, minHeight: 'auto',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addContact}
                  style={{
                    flex: 2, padding: '10px', borderRadius: 12, border: 'none',
                    background: canAdd ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,0.06)',
                    color: canAdd ? '#fff' : 'rgba(255,255,255,0.3)',
                    cursor: canAdd ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700,
                    boxShadow: canAdd ? '0 4px 16px rgba(239,68,68,0.3)' : 'none',
                    minHeight: 'auto', transition: 'all 0.2s',
                  }}
                >
                  Save Contact
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddContact(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px', borderRadius: 12, margin: '8px 0',
                background: 'rgba(239,68,68,0.08)', border: '1px dashed rgba(239,68,68,0.3)',
                color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                minHeight: 'auto', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            >
              <Plus size={16} />
              Add Emergency Contact
            </button>
          )}
        </SectionCard>

        {/* ── Alert Preferences ─────────────────────────────────── */}
        <SectionLabel text="Alert Preferences" />
        <SectionCard>
          <SettingRow
            icon={Bell}
            iconColor="#ef4444"
            title="SOS Notifications"
            subtitle="Alert contacts when SOS is triggered"
            right={<Toggle value={prefs.notifications} onChange={setPref('notifications')} color="#ef4444" />}
          />
          <SettingRow
            icon={Vibrate}
            iconColor="#f97316"
            title="Haptic Feedback"
            subtitle="Vibrate on critical alerts"
            right={<Toggle value={prefs.vibration} onChange={setPref('vibration')} color="#f97316" />}
          />
          <SettingRow
            icon={Zap}
            iconColor="#8b5cf6"
            title="Quick-Key SOS"
            subtitle="Trigger SOS with triple press of F9"
            right={<Toggle value={prefs.autoSOS} onChange={setPref('autoSOS')} color="#8b5cf6" />}
          />
          <SettingRow
            icon={MapPin}
            iconColor="#10b981"
            title="Background Location"
            subtitle="Track location for faster emergency response"
            right={<Toggle value={prefs.locationTracking} onChange={setPref('locationTracking')} color="#10b981" />}
            noBorder
          />
        </SectionCard>

        {/* ── Privacy & Data ────────────────────────────────────── */}
        <SectionLabel text="Privacy & Data" />
        <SectionCard>
          <div style={{ padding: '14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={17} color="#10b981" />
              </div>
              <div>
                <p style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Your Privacy is Protected</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, lineHeight: 1.75 }}>
                  Emergency contacts are stored <span style={{ color: '#4ade80', fontWeight: 600 }}>only on your device</span>. 
                  Your GPS location is shared solely when you press SOS, only with the facility you select. 
                  No personal data is sold or shared with third parties.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {['GDPR Compliant', 'IT Act 2000', 'Zero Data Selling'].map(tag => (
                    <span key={tag} style={{
                      fontSize: 10, fontWeight: 700, color: '#10b981',
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: 6, padding: '2px 8px', letterSpacing: '0.03em',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── About ─────────────────────────────────────────────── */}
        <SectionLabel text="About" />
        <SectionCard>
          <SettingRow
            icon={Info}
            iconColor="#3b82f6"
            title="App Version"
            subtitle="RoadSoS AI Emergency Response"
            right={<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}>v1.0.0</span>}
          />
          <SettingRow
            icon={Heart}
            iconColor="#ef4444"
            title="Made for India"
            subtitle="National Road Safety Hackathon 2026"
            right={<span style={{ fontSize: 14 }}>🇮🇳</span>}
            noBorder
          />
        </SectionCard>

        {/* ── App branding footer ──────────────────────────────── */}
        <div style={{
          textAlign: 'center', padding: '24px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          marginTop: 8,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: '0 8px 24px rgba(239,68,68,0.3)',
          }}>🚑</div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 18, color: '#f0f4ff', letterSpacing: '-0.01em' }}>RoadSoS</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 4 }}>AI-Powered Emergency Response System</p>
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 8 }}>
            Built with ❤️ to save lives on Indian roads
          </p>
        </div>
      </div>
    </div>
  );
}
