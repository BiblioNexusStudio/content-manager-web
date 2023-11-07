import { env } from '$env/dynamic/public';

const API_KEY = env.PUBLIC_AQUIFER_API_KEY;

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function fetchWrapper(url: string, options: FetchOptions = {}): Promise<Response> {
    options.headers = options.headers || {};

    if (!options.headers['api-key']) {
        options.headers['api-key'] = API_KEY;
    }

    options.method = options.method || 'GET';

    return fetch(url, options);
}
