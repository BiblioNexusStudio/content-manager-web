import { browser } from '$app/environment';
import config from '$lib/config';
import { auth0Client } from '$lib/stores/auth';
import type { ExtendType } from '$lib/types/base';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';

const API_KEY = config.PUBLIC_AQUIFER_API_KEY;
const BASE_URL = config.PUBLIC_AQUIFER_API_URL;

// In order to handle errors while streaming we need to have this custom wrapper, since SvelteKit streaming doesn't handle errors.
// https://github.com/sveltejs/kit/issues/9785
export type StreamedError = { _isError: true; code: number; message: string };
export type StreamedData<T> = { streamed: Promise<StreamedError | T> };

type CustomFetchOptions = ExtendType<FetchOptions, 'body', object | undefined>;

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

// Use this in Svelte components to convert the streamed data into the underlying JSON or an error.
//
//   export let data: PageData
//   $: list = unwrapStreamedData(data.streamedList)
//   {#await list}
//     <-- spinner -->
//   {:then list}
//     <-- render content -->>
//   {:catch}
//     <-- error -->
//   {/await}
export async function unwrapStreamedData<T>(data: StreamedData<T>): Promise<T> {
    return unwrapStreamedDataWithCallback(data);
}

// Identical to the above function except it also lets you specify a callback that gets run with the data.
// Useful if you need to perform calculations.
//
//   export let data: PageData
//   let count = 0
//   function computeCountFromData(listData) {
//      count = listData.length
//   }
//   $: list = unwrapStreamedDataWithCallback(data.streamedList, computeCountFromData)
export async function unwrapStreamedDataWithCallback<T>(
    data: StreamedData<T>,
    callback: ((result: T) => void) | undefined = undefined
): Promise<T> {
    return data.streamed.then((result) => {
        const maybeError = result as StreamedError;
        if (maybeError._isError) {
            throw error(maybeError.code, { message: maybeError.message });
        }
        callback && callback(result as T);
        return result as T;
    });
}

let originalFetch: typeof window.fetch | undefined;

// Patch `window.fetch` to add auth token in header for requests to the Aquifer API. This ensures SvelteKit's SSR-loaded data
// is reusable on the client without an extra fetch. This is due to the difference in the presence of the auth token in server-side
// and client-side fetches, affecting the hash calculation used by SvelteKit to determine data reusability.
//
// Server-side `fetch` lacks the auth header initially (injected later by `handleFetch`), while client-side fetch includes it.
// This results in differing hashes for otherwise identical requests, leading the client to re-fetch data.
//
// Example:
// - SSR:    `fetch('/users', { headers: {} })` (no auth header initially)
// - Client: `fetch('/users', { headers: { Authorization: ... } })` (auth header present)
//
// SvelteKit compares the URL and fetch options hash to reuse server-loaded data. Different hashes trigger a client-side re-fetch.
// A future client-side `handleFetch` hook in SvelteKit could replace this patch.
//
// References:
// - [Sentry Issue](https://github.com/getsentry/sentry-javascript/issues/8174#issuecomment-1557042801)
// - [SvelteKit PR](https://github.com/sveltejs/kit/pull/10009)
export function initFetchPatch() {
    if (!browser) {
        throw new Error('This should only be called client-side');
    }

    if (!originalFetch) {
        originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit | undefined): Promise<Response> => {
            // Determine URL from input
            let url: string;
            if (typeof input === 'string') {
                url = input;
            } else if (input instanceof URL) {
                url = input.toString();
            } else {
                // Assuming input is a Request object
                url = input.url;
            }

            if (url.startsWith(config.PUBLIC_AQUIFER_API_URL)) {
                // Merge or create init object
                init = init || {};
                init.headers = {
                    ...(init.headers || {}),
                    ...(await authTokenHeader()),
                };
            }

            return originalFetch!(input, init);
        };
    }
}

// Fetch JSON from the API that's wrapped in an object with a `streamed` key.
//
// This takes advantage of SvelteKit's streaming functionality to allow a page
// to be rendered before all of the data has finished loading.
//
// Due to a limitation in SvelteKit, this serializes errors into a specific JSON
// format that then gets read by `unwrapStreamedData` and turned back into an error for the client to handle.
export function fetchJsonStreamingFromApi<T>(
    path: string,
    options: CustomFetchOptions = {},
    injectedFetch: typeof window.fetch | undefined = undefined
): StreamedData<T> {
    return {
        streamed: new Promise((resolve) => {
            fetchFromApiWithAuth(path, options, injectedFetch)
                .catch((error: Error) => {
                    resolve({
                        _isError: true,
                        code: 500,
                        message: error.message,
                    } as StreamedError);
                    return false;
                })
                .then((response) => {
                    if (response && typeof response === 'object') {
                        if (response.status >= 400) {
                            resolve({
                                _isError: true,
                                code: response.status,
                                message: `HTTP response: ${response.status}`,
                            } as StreamedError);
                        }
                        return response.json();
                    }
                })
                .then((json) => {
                    resolve(json);
                })
                .catch(() => {
                    resolve({ _isError: true, code: 400, message: 'Error parsing JSON' } as StreamedError);
                });
        }),
    };
}

// Base fetch function for the Aquifer API. Handles auth, body stringifying, content type, prefixing the API path with
// the base URL, and detecting errors.
export async function fetchFromApiWithAuth(
    path: string,
    options: CustomFetchOptions,
    injectedFetch: typeof window.fetch | undefined = undefined
) {
    const fetchOptions: FetchOptions = options as FetchOptions;

    fetchOptions.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (!fetchOptions.headers['api-key']) {
        fetchOptions.headers['api-key'] = API_KEY;
    }

    if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
    }

    const url = BASE_URL + '/' + (path.startsWith('/') ? path.slice(1) : path);

    const response = await (injectedFetch || fetch)(url, fetchOptions);
    if (response.status >= 400) {
        throw error(response.status, `HTTP response: ${response.status}`);
    }
    return response;
}

export async function fetchJsonFromApiWithAuth(
    path: string,
    options: CustomFetchOptions,
    injectedFetch: typeof window.fetch | undefined = undefined
) {
    const response = await fetchFromApiWithAuth(path, options, injectedFetch);
    try {
        return await response.json();
    } catch {
        throw error(400, 'Error parsing JSON');
    }
}

async function authTokenHeader(): Promise<object> {
    const token = await get(auth0Client)?.getTokenSilently();
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
}
