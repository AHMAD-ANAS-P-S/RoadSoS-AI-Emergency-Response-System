import React, { useState, useEffect } from 'react';
import { Globe, Bell, Shield, Plus, Trash2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code:'en', label:'English' }, { code:'hi', label:'हिंदी' },
  { code:'ta', label:'தமிழ்' }, { code:'te', label:'తెలుగు' },
  { code:'kn', label:'ಕನ್ನಡ' }, { code:'ml', label:'മലയാളം' },
  { code:'bn', label:'বাংলা' }, { code:'mr', label:'मराठी' },
  { code:'gu', label:'ગુજરાતી' }, { code:'pa', label:'ਪੰਜਾਬੀ' },
];

export default function SettingsScreen() {
  const { i18n, t } = useTranslation();
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('roadsos_contacts') || '[]'); } catch { return []; }
  });
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    localStorage.setItem('roadsos_contacts', JSON.stringify(contacts));
  }, [contacts]);

  const addContact = () => {
    if (newContact.name && newContact.phone) {
      setContacts(prev => [...prev, { ...newContact, id: Date.now() }]);
      setNewContact({ name: '', phone: '' });
    }
  };

  const removeContact = (id) => setContacts(prev => prev.filter(c => c.id !== id));

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 pb-20 px-4">
      <div className="py-4">
        <h2 className="text-white text-xl font-bold">Settings</h2>
        <p className="text-gray-400 text-sm">Personalise RoadSoS for your needs</p>
      </div>

      {/* Language */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={18} className="text-red-500"/>
          <h3 className="text-white font-semibold">Language</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(lang => (
            <button key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors
                ${i18n.language === lang.code ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <User size={18} className="text-red-500"/>
          <h3 className="text-white font-semibold">Emergency Contacts</h3>
        </div>
        <p className="text-gray-400 text-xs mb-3">These contacts will be alerted automatically when you trigger SOS</p>

        {contacts.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2 mb-2">
            <div>
              <p className="text-white text-sm font-medium">{c.name}</p>
              <p className="text-gray-400 text-xs">{c.phone}</p>
            </div>
            <button onClick={() => removeContact(c.id)} className="text-red-500 hover:text-red-400">
              <Trash2 size={16}/>
            </button>
          </div>
        ))}

        <div className="flex gap-2 mt-3">
          <input className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm outline-none border border-gray-700 focus:border-red-500"
            placeholder="Contact name" value={newContact.name}
            onChange={e => setNewContact(p => ({...p, name: e.target.value}))}/>
          <input className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm outline-none border border-gray-700 focus:border-red-500"
            placeholder="Phone (+91...)" value={newContact.phone} type="tel"
            onChange={e => setNewContact(p => ({...p, phone: e.target.value}))}/>
          <button onClick={addContact} className="bg-red-600 hover:bg-red-700 text-white rounded-xl p-2 transition-colors">
            <Plus size={18}/>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-red-500"/>
            <div>
              <h3 className="text-white font-semibold text-sm">SOS Notifications</h3>
              <p className="text-gray-400 text-xs">Alert contacts when SOS is triggered</p>
            </div>
          </div>
          <button onClick={() => setNotifications(p => !p)}
            className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-red-600' : 'bg-gray-700'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notifications ? 'left-6' : 'left-0.5'}`}/>
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-gray-900 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={18} className="text-red-500"/>
          <h3 className="text-white font-semibold">Privacy & Data</h3>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">
          RoadSoS stores emergency contacts locally on your device only. Your GPS location is shared only when you trigger SOS, and only with facilities you select. No data is sold to third parties. GDPR & IT Act compliant.
        </p>
      </div>
    </div>
  );
}
