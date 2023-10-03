import { browser } from '$app/environment';
import { init, register } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('en-US', () => import('./locales/en.json'));

export async function init18n() {
    await init({
        fallbackLocale: defaultLocale,
        initialLocale: browser ? window.navigator.language : defaultLocale,
    });
}
