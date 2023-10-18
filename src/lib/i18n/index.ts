import { browser } from '$app/environment';
import { init as svelteI18nInit, register, locale } from 'svelte-i18n';

register('eng', () => import('./locales/eng.json'));

export async function initI18n() {
    const language = browserLanguageToISO6393(browser ? navigator.language : 'en-US');
    locale.set(language);
    await svelteI18nInit({
        fallbackLocale: 'eng',
        initialLocale: language,
    });
}

function browserLanguageToISO6393(browserLanguage: string) {
    const twoDigit = browserLanguage.toLowerCase().split('-')[0];
    if (twoDigit === 'en') {
        return 'eng';
    }
    return null;
}
