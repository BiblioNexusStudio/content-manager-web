import { browser } from '$app/environment';
import config from '$lib/config';
import { authTokenHeader } from './http-service';

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

if (browser) {
    const originalFetch = window.fetch;
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

        return originalFetch(input, init);
    };
    window._fetchIsPatched = true;
}
