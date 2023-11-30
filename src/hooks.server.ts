import type { Handle, HandleFetch, HandleServerError } from '@sveltejs/kit';
import { locale } from 'svelte-i18n';
import config from '$lib/config';
import { log } from '$lib/logger';

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
    headers.set('api-key', config.PUBLIC_AQUIFER_API_KEY);
    const newRequest = new Request(request, { headers });

    return fetch(newRequest);
};

export const handleError = (async ({ error }: { error: Error }) => {
    log.exception(error);

    return {
        message: 'Unexpected error',
    };
    // eslint-disable-next-line
    // @ts-ignore
}) satisfies HandleServerError;
