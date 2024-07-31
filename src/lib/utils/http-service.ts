import config from '$lib/config';
import { auth0Client, logout } from '$lib/stores/auth';
import type { ExtendType } from '$lib/types/base';
import { FetchError, ApiError, AuthUninitializedError, TokenMissingError } from './http-errors';

const API_KEY = config.PUBLIC_AQUIFER_API_KEY;
const BASE_URL = config.PUBLIC_AQUIFER_API_URL;

type CustomFetchOptions = ExtendType<FetchOptions, 'body', object | undefined>;
type RequestBody = Record<string, unknown>;

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

// This takes advantage of SvelteKit's streaming functionality to allow a page
// to be rendered before all of the data has finished loading.
export function getFromApiWithoutBlocking<T = never>(
    path: string,
    injectedFetch: typeof window.fetch
): { promise: Promise<T> } {
    return {
        promise: rawApiFetch(path, injectedFetch, {}).then((response) => response.json() as T),
    };
}

// Base fetch function for the Aquifer API. Handles auth, body stringifying, content type, prefixing the API path with
// the base URL, and detecting errors.
async function rawApiFetch(path: string, injectedFetch: typeof window.fetch | null, options: CustomFetchOptions) {
    const fetchOptions: FetchOptions = options as FetchOptions;

    fetchOptions.headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : null),
        ...options.headers,
    };

    if (!fetchOptions.headers['api-key']) {
        fetchOptions.headers['api-key'] = API_KEY;
    }

    if (!fetchOptions.headers['Authorization']) {
        fetchOptions.headers['Authorization'] = (await authTokenHeader()) as string;
    }

    if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
    }

    const pathWithSlash = pathPrefixedWithSlash(path);
    const url = BASE_URL + pathWithSlash;

    let response: Response | null;

    try {
        response = await (injectedFetch || fetch)(url, fetchOptions);
    } catch (error) {
        throw new FetchError(pathWithSlash, fetchOptions.method || 'GET', (error as Error).message);
    }

    if (response.status >= 400) {
        let body: string | object | null = null;
        try {
            body = await response.json();
        } catch {
            try {
                body = await response.text();
            } catch {
                // ignore if both awaits fail
            }
        }
        throw new ApiError(response.status, body, fetchOptions.method || 'GET', pathWithSlash);
    }

    return response;
}

export async function getFromApi<T = never>(
    path: string,
    injectedFetch: typeof window.fetch | null = null
): Promise<T | null> {
    return await rawApiFetch(path, injectedFetch, {}).then((response) => response.json());
}

export async function postToApi<T = never>(path: string, body: RequestBody | undefined = undefined): Promise<T | null> {
    const response = await rawApiFetch(path, null, { body: body || {}, method: 'POST' });
    const text = await response.text();
    if (text === '') {
        return null;
    }
    return JSON.parse(text);
}

export async function rawPostToApi(path: string, body: RequestBody | undefined = undefined) {
    return await rawApiFetch(path, null, { body: body || {}, method: 'POST' });
}

export async function patchToApi<T = never>(
    path: string,
    body: RequestBody | undefined = undefined
): Promise<T | null> {
    const response = await rawApiFetch(path, null, { body: body || {}, method: 'PATCH' });
    const text = await response.text();
    if (text === '') {
        return null;
    }
    return JSON.parse(text);
}

export async function putToApi<T = never>(path: string, body: RequestBody | undefined = undefined): Promise<T | null> {
    const response = await rawApiFetch(path, null, { body: body || {}, method: 'PUT' });
    const text = await response.text();
    if (text === '') {
        return null;
    }
    return JSON.parse(text);
}

// To deal with Auth0 weirdness, this does the following:
// 1. try to get the token normally
//   a. if the token is expired, get the token bypassing the cache
// 2. if there is an error due to "login_required", then logout
// 3. if there is any other kind of error, get the token bypassing the cache
// 4. if that still doesn't work, get the token by doing a popup, which lets the user login and continue the request
//    that was running.
async function authTokenHeader(): Promise<string | undefined> {
    if (!auth0Client) {
        throw new AuthUninitializedError();
    }

    let token = undefined;

    try {
        token = await auth0Client.getTokenSilently();
        if (token) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]!));
            const currentTime = Math.floor(Date.now() / 1000);

            if (decodedToken.exp <= currentTime) {
                token = await auth0Client.getTokenSilently({ cacheMode: 'off' });
            }
        }
    } catch (error) {
        const castError = error as { error?: string } | undefined;
        if (castError && 'error' in castError && castError.error === 'login_required') {
            await logout(new URL(window.location.toString()));
        } else {
            try {
                token = await auth0Client.getTokenSilently({ cacheMode: 'off' });
            } catch {
                try {
                    token = await auth0Client.getTokenWithPopup();
                } catch {
                    // popup failed for some reason, will logout below
                }
            }
        }
    }

    // if for some reason the token couldn't be retrieved and there was no Auth0 error, logout
    if (!token) {
        await logout(new URL(window.location.toString()));
        throw new TokenMissingError();
    }

    return `Bearer ${token}`;
}

function pathPrefixedWithSlash(path: string) {
    return '/' + (path.startsWith('/') ? path.slice(1) : path);
}
