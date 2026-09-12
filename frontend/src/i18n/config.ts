import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import as from './locales/as.json';

const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('nera_language');
  return savedLanguage || 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      as: { translation: as },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safeguards from xss
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('nera_language', lng);
});

export default i18n;
