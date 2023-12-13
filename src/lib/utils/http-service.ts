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

    // Wait for fetch to be patched if it's a browser (prevents race conditions)
    browser && (await waitForValidValue(async () => window._fetchIsPatched, 50));

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

export async function authTokenHeader(): Promise<object> {
    // Wait for the auth client to be initialized and a valid token (prevents race conditions)
    const token = await waitForValidValue(async () => await get(auth0Client)?.getTokenSilently(), 50);
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
}

// Wait for a truthy (not null, not undefined, not false) value to be returned by `fn` or returns the most recent
// value if the timeout is reached.
async function waitForValidValue<T>(fn: () => Promise<T | undefined>, maxTimeout: number): Promise<T | undefined> {
    const startTime = Date.now();
    let value: T | undefined = await fn();
    while (!value && Date.now() - startTime < maxTimeout) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        value = await fn();
    }
    return value;
}
