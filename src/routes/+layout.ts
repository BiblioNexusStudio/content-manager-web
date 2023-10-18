import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';

export const load: LayoutLoad = async () => {
    await initI18n();
    await waitLocale();
};
