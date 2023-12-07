import config from '$lib/config';
import { error } from '@sveltejs/kit';

const API_KEY = config.PUBLIC_AQUIFER_API_KEY;
const BASE_URL = config.PUBLIC_AQUIFER_API_URL;

// In order to handle errors while streaming we need to have this custom wrapper, since SvelteKit streaming doesn't handle errors.
// https://github.com/sveltejs/kit/issues/9785
export type StreamedError = { _isError: true; code: number; message: string };
export type StreamedData<T> = { streamed: Promise<StreamedError | T> };

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
    options: FetchOptions = {},
    injectedFetch: typeof window.fetch | undefined = undefined
): StreamedData<T> {
    return {
        streamed: new Promise((resolve) => {
            fetchFromApi(path, options, injectedFetch)
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

export async function fetchJsonFromApi(
    path: string,
    options: FetchOptions = {},
    injectedFetch: typeof window.fetch | undefined = undefined
): Promise<unknown> {
    const response = await fetchFromApi(path, options, injectedFetch);
    try {
        return await response.json();
    } catch {
        throw error(400, 'Error parsing JSON');
    }
}

export async function fetchFromApi(
    path: string,
    options: FetchOptions,
    injectedFetch: typeof window.fetch | undefined = undefined
) {
    options.headers = options.headers || {};

    if (!options.headers['api-key']) {
        options.headers['api-key'] = API_KEY;
    }

    const url = BASE_URL + '/' + (path.startsWith('/') ? path.slice(1) : path);

    const response = await (injectedFetch || fetch)(url, options);
    if (response.status >= 400) {
        throw error(response.status, `HTTP response: ${response.status}`);
    }
    return response;
}
