import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { locale, waitLocale } from 'svelte-i18n';
import { init18n } from '$lib/i18n';

export const load: LayoutLoad = async () => {
    if (browser) {
        locale.set(window.navigator.language);
    }

    await init18n();
    await waitLocale();
};
