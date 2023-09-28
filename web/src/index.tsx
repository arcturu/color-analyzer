import './index.css';
import App from './App';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import langja from './lang/ja.json';
import langen from './lang/en.json';

const getLangKey = () => {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('ja')) {
    return 'ja';
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    ja: langja,
    en: langen,
  },
  lng: getLangKey(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
