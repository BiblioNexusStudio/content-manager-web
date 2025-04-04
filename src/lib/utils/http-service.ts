import config from '$lib/config';
import { auth0Client, logout } from '$lib/stores/auth';
import type { ExtendType } from '$lib/types/base';
import { FetchError, ApiError, AuthUninitializedError, TokenMissingError } from './http-errors';

const API_KEY = config.PUBLIC_AQUIFER_API_KEY;
const BASE_URL = config.PUBLIC_AQUIFER_API_URL;
const SOURCE_HEADER = 'admin-cms';

type CustomFetchOptions = ExtendType<FetchOptions, 'body', object | undefined> & {
    isFormData?: boolean;
    formData?: FormData;
};
type RequestBody = Record<string, unknown>;

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

/**
 * Base fetch function for the Aquifer API. Handles auth, body stringifying, content type, prefixing the API path with
 * the base URL, and detecting errors.
 *
 * @param path - The API endpoint path
 * @param injectedFetch - Optional fetch function to use instead of global fetch
 * @param options - Request options including headers and body
 * @throws {FetchError} When the network request fails
 * @throws {ApiError} When the API returns an error status (>=400)
 */
async function rawApiFetch(path: string, injectedFetch: typeof window.fetch | null, options: CustomFetchOptions) {
    const fetchOptions: FetchOptions = options as FetchOptions;

    fetchOptions.headers = {
        ...(!options.isFormData && options.body ? { 'Content-Type': 'application/json' } : null),
        ...options.headers,
    };

    if (!fetchOptions.headers['api-key']) {
        fetchOptions.headers['api-key'] = API_KEY;
    }

    if (!fetchOptions.headers['Authorization']) {
        fetchOptions.headers['Authorization'] = (await authTokenHeader()) as string;
    }

    if (!fetchOptions.headers['bn-source']) {
        fetchOptions.headers['bn-source'] = SOURCE_HEADER;
    }

    if (options.body && !options.isFormData) {
        fetchOptions.body = JSON.stringify(options.body);
    } else if (options.isFormData) {
        fetchOptions.body = options.formData as FormData;
    }

    const pathWithSlash = pathPrefixedWithSlash(path);
    const url = BASE_URL + pathWithSlash;

    let response: Response;

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

/**
 * Makes a GET request to the specified API endpoint and returns the response data.
 * Since any non-successful HTTP status (>=400) throws an ApiError, this method will
 * always return type T when it completes successfully.
 *
 * @param path - The API endpoint path
 * @param injectedFetch - Optional fetch function to use instead of global fetch
 * @throws {ApiError} When the API returns an error status
 * @throws {FetchError} When the network request fails
 */
export async function getFromApi<T = never>(
    path: string,
    injectedFetch: typeof window.fetch | null = null
): Promise<T> {
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

export async function postFormDataToApi<T = never>(path: string, formData: FormData): Promise<T | null> {
    const response = await rawApiFetch(path, null, { formData: formData, method: 'POST', isFormData: true });
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

export async function deleteToApi<T = never>(
    path: string,
    body: RequestBody | undefined = undefined
): Promise<T | null> {
    const response = await rawApiFetch(path, null, { body: body || {}, method: 'DELETE' });
    const text = await response.text();
    if (text === '') {
        return null;
    }
    return JSON.parse(text);
}

/**
 * Handles token retrieval and authentication flow with Auth0.
 *
 * @returns A promise that resolves to the authentication token
 * prefixed with 'Bearer ', or undefined if token retrieval fails
 *
 * @throws {AuthUninitializedError} If the auth0Client is not initialized
 * @throws {TokenMissingError} If token retrieval fails and user is logged out
 *
 * @description
 * Token retrieval process:
 * 1. Attempts to retrieve token silently
 * 2. If token is expired, bypasses cache to get new token
 * 3. On 'login_required' error, logs user out
 * 4. On other errors, attempts to bypass cache
 * 5. If cache bypass fails, attempts popup authentication
 */
async function authTokenHeader() {
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
