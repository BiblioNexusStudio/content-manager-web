import { AUTH_COOKIE_NAME } from '$lib/stores/auth';
import type { LayoutServerLoad } from './$types';

// This runs on the server so it has access to the cookies. It will pass along its returned data to the regular
// +layout.ts file which can then determine what to do based on authenticated state. This helps us avoid a lot of 401
// requests due to missing an auth token.
export const load: LayoutServerLoad = async ({ cookies }) => {
    let hasAuthCookie = false;

    if (cookies.get(AUTH_COOKIE_NAME)) {
        hasAuthCookie = true;
    }

    return {
        hasAuthCookie,
    };
};
