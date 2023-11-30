import { type Writable, writable, get } from 'svelte/store';
import { Auth0Client, createAuth0Client, User } from '@auth0/auth0-spa-js';
import config from '$lib/config';
import { goto } from '$app/navigation';
import { log } from '$lib/logger';

export const auth0Client: Writable<Auth0Client | undefined> = writable(undefined);
export const profile: Writable<User | undefined> = writable(undefined);
export const authenticated: Writable<boolean> = writable(false);
export const canEdit: Writable<boolean> = writable(false);
const auth0Domain = config.PUBLIC_AUTH0_DOMAIN;
const auth0ClientId = config.PUBLIC_AUTH0_CLIENT_ID;
const auth0Audience = config.PUBLIC_AUTH0_AUDIENCE;
const editorRoles = ['admin', 'editor'];

profile.subscribe((user) => {
    canEdit.set(editorRoles.some((role) => user?.bnRoles.includes(role)));
});

let currentUrl: URL;
export const setCurrentPageUrl = (url: URL) => {
    currentUrl = url;
};

export const initAuth0 = async () => {
    const client = await createAuth0Client({
        domain: auth0Domain,
        clientId: auth0ClientId,
        useRefreshTokens: true,
        cacheLocation: 'localstorage',
        authorizationParams: {
            audience: auth0Audience,
        },
    });

    auth0Client.set(client);

    let isAuthenticated = await client.isAuthenticated();

    if (!isAuthenticated && currentUrl.searchParams.has('code') && currentUrl.searchParams.has('state')) {
        await client.handleRedirectCallback();
        await goto('/');
        isAuthenticated = await client.isAuthenticated();
    }

    if (isAuthenticated) {
        try {
            profile.set(await client.getUser());
            authenticated.set(isAuthenticated);
        } catch (error) {
            log.exception(error as Error);
            await logout();
        }
    } else {
        authenticated.set(false);
        await login();
    }
};

const login = async () => {
    await get(auth0Client)?.loginWithRedirect({
        authorizationParams: {
            redirect_uri: currentUrl.href,
        },
    });
};

export const logout = async () => {
    profile.set(undefined);
    authenticated.set(false);
    await get(auth0Client)?.logout({
        logoutParams: {
            returnTo: currentUrl.origin,
        },
    });
};
