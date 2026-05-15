// src/services/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import ta from '../i18n/ta.json';

const savedLang = localStorage.getItem('roadsos_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, ta: { translation: ta } },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => localStorage.setItem('roadsos_lang', lng));

export default i18n;
