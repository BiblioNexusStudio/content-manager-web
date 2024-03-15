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

async function authTokenHeader(): Promise<string | undefined> {
    if (!auth0Client) {
        throw new AuthUninitializedError();
    }

    let token = undefined;

    try {
        token = await auth0Client.getTokenSilently();
    } catch {
        // if the user is no longer logged in, take them through the login process
        await logout(new URL(window.location.toString()));
        return token;
    }

    // if for some reason the token couldn't be retrieved and there was no Auth0 error, throw our own error
    if (!token) {
        throw new TokenMissingError();
    }

    return `Bearer ${token}`;
}

function pathPrefixedWithSlash(path: string) {
    return '/' + (path.startsWith('/') ? path.slice(1) : path);
}
