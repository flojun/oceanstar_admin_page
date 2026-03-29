import ko from "@/locales/ko";
import en from "@/locales/en";

export type Language = "ko" | "en";

const translations: Record<Language, any> = {
    ko,
    en,
};

/**
 * Returns a translation function for a specific language
 * Safe to be used in Server Components as well as Client Components
 */
export const getTranslation = (lang: Language) => {
    return (path: string) => {
        const keys = path.split(".");
        let current: any = translations[lang];
        for (const key of keys) {
            if (current === undefined || current[key] === undefined) {
                return path; // Fallback to raw path string if missing
            }
            current = current[key];
        }
        return current;
    };
};

/**
 * Utility to set language cookie (specifically for middleware to detect user override target language)
 */
export const setLanguageCookie = (lang: Language) => {
    if (typeof document !== 'undefined') {
        document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`; // 1 year expiry
    }
};
