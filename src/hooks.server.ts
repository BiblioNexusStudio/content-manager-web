import type { Handle, HandleFetch } from '@sveltejs/kit';
import { locale } from 'svelte-i18n';
import { env } from '$env/dynamic/public';

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

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
    const headers = new Headers(request.headers);
    headers.set('api-key', env.PUBLIC_AQUIFER_API_KEY);
    const newRequest = new Request(request, { headers });

    return fetch(newRequest);
};
