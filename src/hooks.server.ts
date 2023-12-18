import type { Handle, HandleFetch, HandleServerError } from '@sveltejs/kit';
import { locale } from 'svelte-i18n';
import config from '$lib/config';
import { log } from '$lib/logger';
import { AUTH_COOKIE_NAME } from '$lib/stores/auth';

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

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    // only add auth info to Aquifer requests (prevents leaking credentials if we ever fetch from other APIs)
    if (request.url.startsWith(config.PUBLIC_AQUIFER_API_URL)) {
        const authToken = event.cookies.get(AUTH_COOKIE_NAME);
        if (authToken) {
            request.headers.set('Authorization', `Bearer ${authToken}`);
        }
    }

    return fetch(request);
};

export const handleError = (async ({ error }: { error: Error }) => {
    log.exception(error);

    if (config.PUBLIC_ENV === 'qa' || config.PUBLIC_ENV === 'dev' || config.PUBLIC_ENV === 'local') {
        return {
            message: error.message,
        };
    } else {
        return {
            message: 'Unexpected error',
        };
    }
    // eslint-disable-next-line
    // @ts-ignore
}) satisfies HandleServerError;
