import config from '$lib/config';
import { auth0Client } from '$lib/stores/auth';
import type { ExtendType } from '$lib/types/base';
import { error } from '@sveltejs/kit';

const API_KEY = config.PUBLIC_AQUIFER_API_KEY;
const BASE_URL = config.PUBLIC_AQUIFER_API_URL;

type CustomFetchOptions = ExtendType<FetchOptions, 'body', object | undefined>;
type RequestBody = Record<string, unknown>;

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

// This takes advantage of SvelteKit's streaming functionality to allow a page
// to be rendered before all of the data has finished loading.
export function getFromApiWithoutBlocking<T = never>(path: string): { promise: Promise<T> } {
    return {
        promise: rawApiFetch(path, {}).then((response) => response.json() as T),
    };
}

// Base fetch function for the Aquifer API. Handles auth, body stringifying, content type, prefixing the API path with
// the base URL, and detecting errors.
async function rawApiFetch(path: string, options: CustomFetchOptions) {
    const fetchOptions: FetchOptions = options as FetchOptions;

    fetchOptions.headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : null),
        ...options.headers,
    };

    if (!fetchOptions.headers['api-key']) {
        fetchOptions.headers['api-key'] = API_KEY;
    }

    if (!fetchOptions.headers['Authorization']) {
        fetchOptions.headers['Authorization'] = await authTokenHeader();
    }

    if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
    }

    const pathWithSlash = pathPrefixedWithSlash(path);
    const url = BASE_URL + pathWithSlash;

    let response: Response | null;

    try {
        response = await fetch(url, fetchOptions);
    } catch (error) {
        throw new Error(errorMessage((error as Error).message, null, pathWithSlash));
    }

    if (response.status >= 400) {
        let message: string | null = null;
        try {
            message = await response.text();
        } catch {
            // error getting response text, that's fine though, don't want to override the actual HTTP error
        }
        throw error(response.status, errorMessage(message, response.status, pathWithSlash));
    }
    return response;
}

export async function getFromApi<T = never>(path: string): Promise<T | null> {
    return await rawApiFetch(path, {}).then((response) => response.json());
}

export async function postToApi<T = never>(path: string, body: RequestBody | undefined = undefined): Promise<T | null> {
    const response = await rawApiFetch(path, { body, method: 'POST' });
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
    const response = await rawApiFetch(path, { body, method: 'PATCH' });
    const text = await response.text();
    if (text === '') {
        return null;
    }
    return JSON.parse(text);
}

export async function putToApi<T = never>(path: string, body: RequestBody | undefined = undefined): Promise<T | null> {
    const response = await rawApiFetch(path, { body, method: 'PUT' });
    const text = await response.text();
    if (text === '') {
        return null;
    }
    return JSON.parse(text);
}

async function authTokenHeader(): Promise<string> {
    // Wait for the auth client to be initialized and a valid token (prevents race conditions)
    const token = await waitForValidValue(async () => await auth0Client?.getTokenSilently(), true, 500);
    if (token) {
        return `Bearer ${token}`;
    }
    return '';
}

// Wait for a truthy (not null, not undefined, not false) value to be returned by `fn` or returns the most recent
// value if the timeout is reached.
async function waitForValidValue<T>(
    fn: () => Promise<T | undefined>,
    ignoreErrors: boolean,
    maxTimeout: number
): Promise<T | undefined> {
    const startTime = Date.now();
    let value: T | undefined = undefined;
    while (!value && Date.now() - startTime < maxTimeout) {
        try {
            value = await fn();
        } catch (error) {
            if (!ignoreErrors) {
                throw error;
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return value;
}

function errorMessage(message: string | null, code: number | undefined | null, path: string) {
    let output = 'HTTP error.';
    if (code) {
        output += ` Code: '${code}'`;
    }
    if (message) {
        output += ` Message: '${message}'`;
    }
    output += ` Path: '${path}'`;
    return output;
}

function pathPrefixedWithSlash(path: string) {
    return '/' + (path.startsWith('/') ? path.slice(1) : path);
}
