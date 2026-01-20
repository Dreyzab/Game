import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import commonRu from '../../locales/ru/common.json';
import commonEn from '../../locales/en/common.json';
import commonDe from '../../locales/de/common.json';
import settingsRu from '../../locales/ru/settings.json';
import settingsEn from '../../locales/en/settings.json';
import settingsDe from '../../locales/de/settings.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            ru: {
                common: commonRu,
                settings: settingsRu,
            },
            en: {
                common: commonEn,
                settings: settingsEn,
            },
            de: {
                common: commonDe,
                settings: settingsDe,
            },
        },
        fallbackLng: 'ru',
        ns: ['common', 'settings'],
        defaultNS: 'common',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
