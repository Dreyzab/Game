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
import detectiveRu from '../../locales/ru/detective.json';
import detectiveEn from '../../locales/en/detective.json';
import detectiveDe from '../../locales/de/detective.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            ru: {
                common: commonRu,
                settings: settingsRu,
                detective: detectiveRu,
            },
            en: {
                common: commonEn,
                settings: settingsEn,
                detective: detectiveEn,
            },
            de: {
                common: commonDe,
                settings: settingsDe,
                detective: detectiveDe,
            },
        },
        fallbackLng: 'ru',
        ns: ['common', 'settings', 'detective'],
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
