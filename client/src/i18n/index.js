import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import tr from './locales/tr.json';
import en from './locales/en.json';

// ── i18n Configuration ───────────────────────────────────────────────────────
// Default language: Turkish
// Fallback language: Turkish (if a key is missing in EN, fall back to TR)
// Persistence: localStorage under key `dwellgo_lang`
// ────────────────────────────────────────────────────────────────────────────

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            tr: { translation: tr },
            en: { translation: en },
        },
        fallbackLng: 'tr',
        supportedLngs: ['tr', 'en'],
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'dwellgo_lang',
            caches: ['localStorage'],
        },
        interpolation: { escapeValue: false },
        returnEmptyString: false,
        // In dev, surface missing keys as console warnings so we catch them early
        saveMissing: import.meta.env.DEV,
        missingKeyHandler: import.meta.env.DEV
            ? (lngs, ns, key) => console.warn(`[i18n] Missing key: ${key} (${lngs.join(',')})`)
            : undefined,
    });

export default i18n;
