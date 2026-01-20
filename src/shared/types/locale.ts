export type Locale = 'ru' | 'en' | 'de';

export type LocalizedString = string | {
    ru: string;
    en?: string;
    de?: string;
};

/**
 * Resolves a LocalizedString to a plain string based on the given locale.
 * Falls back to 'ru' if the target locale is missing.
 * If the value is a plain string, returns it (assumes RU legacy).
 */
export function resolveLocalizedString(value: LocalizedString | undefined | null, locale: Locale = 'ru'): string {
    if (!value) return '';

    if (typeof value === 'string') {
        return value;
    }

    // Object-based localization
    const targetValue = value[locale];
    if (targetValue !== undefined && targetValue !== null) {
        return targetValue;
    }

    // Fallback to RU
    if (locale !== 'ru' && value.ru !== undefined && value.ru !== null) {
        return value.ru;
    }

    // Last resort: return first available string from the object
    const available = Object.values(value).find(v => typeof v === 'string') as string | undefined;
    return available || '';
}
