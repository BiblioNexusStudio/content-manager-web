import config from '$lib/config';
import { browser } from '$app/environment';

const API_KEY = config.PUBLIC_AQUIFER_API_KEY;

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function fetchWrapper(url: string, options: FetchOptions = {}): Promise<Response> {
    options.headers = options.headers || {};

    if (!options.headers['api-key']) {
        options.headers['api-key'] = API_KEY;
    }

    if (!browser) {
        options.headers['Origin'] = 'aquifer-admin';
    }

    options.method = options.method || 'GET';

    return fetch(url, options);
}
