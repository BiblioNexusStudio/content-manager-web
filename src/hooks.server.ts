import type { Handle } from '@sveltejs/kit';
import { locale } from 'svelte-i18n';

const defaultLocale = 'en';

export const handle: Handle = async ({ event, resolve }) => {
    const theme = event.cookies.get('dataTheme') ?? 'biblioNexusLight';

    const lang = event.request.headers.get('accept-language')?.split(',')[0] ?? defaultLocale;
    if (lang) {
        locale.set(lang);
    }

    return resolve(event, {
        transformPageChunk: ({ html }) => html.replace('data-theme=""', `data-theme="${theme}"`),
    });
};
