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
import homeRu from '../../locales/ru/home.json';
import homeEn from '../../locales/en/home.json';
import homeDe from '../../locales/de/home.json';
import visualNovelRu from '../../locales/ru/visualNovel.json';
import visualNovelEn from '../../locales/en/visualNovel.json';
import visualNovelDe from '../../locales/de/visualNovel.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            ru: {
                common: commonRu,
                settings: settingsRu,
                detective: detectiveRu,
                home: homeRu,
                visualNovel: visualNovelRu,
            },
            en: {
                common: commonEn,
                settings: settingsEn,
                detective: detectiveEn,
                home: homeEn,
                visualNovel: visualNovelEn,
            },
            de: {
                common: commonDe,
                settings: settingsDe,
                detective: detectiveDe,
                home: homeDe,
                visualNovel: visualNovelDe,
            },
        },
        fallbackLng: 'ru',
        ns: ['common', 'settings', 'detective', 'home', 'visualNovel'],
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
