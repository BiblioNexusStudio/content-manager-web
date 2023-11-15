import { type Writable, writable } from 'svelte/store';
import { Auth0Client, createAuth0Client, User } from '@auth0/auth0-spa-js';
import config from '$lib/config';
import { goto } from '$app/navigation';

export const profile: Writable<User | undefined> = writable(undefined);
export const token: Writable<string | undefined> = writable(undefined);
export const authenticated: Writable<boolean> = writable(false);
export const canEdit: Writable<boolean> = writable(false);
const auth0Domain = config.PUBLIC_AUTH0_DOMAIN;
const auth0ClientId = config.PUBLIC_AUTH0_CLIENT_ID;
const auth0Audience = config.PUBLIC_AUTH0_AUDIENCE;
let auth0Client: Auth0Client | undefined = undefined;
const editorRoles = ['admin', 'editor'];

profile.subscribe((user) => {
    canEdit.set(editorRoles.some((role) => user?.bnRoles.includes(role)));
});

let currentUrl: URL;
export const setCurrentPageUrl = (url: URL) => {
    currentUrl = url;
};

export const initAuth0 = async () => {
    console.log('running initAuth0');

    auth0Client = await createAuth0Client({
        domain: auth0Domain,
        clientId: auth0ClientId,
        useRefreshTokens: true,
        cacheLocation: 'localstorage',
        authorizationParams: {
            audience: auth0Audience,
        },
    });

    let isAuthenticated = await auth0Client.isAuthenticated();
    authenticated.set(isAuthenticated);

    if (!isAuthenticated && currentUrl.searchParams.has('code') && currentUrl.searchParams.has('state')) {
        await auth0Client.handleRedirectCallback();
        await goto('/');
        isAuthenticated = await auth0Client.isAuthenticated();
        authenticated.set(isAuthenticated);
    }

    if (isAuthenticated) {
        try {
            profile.set(await auth0Client.getUser());
            token.set(await auth0Client.getTokenSilently());
        } catch (e) {
            await logout();
        }
    } else {
        await login();
    }
};

const login = async () => {
    await auth0Client?.loginWithRedirect({
        authorizationParams: {
            redirect_uri: currentUrl.href,
        },
    });
};

export const logout = async () => {
    profile.set(undefined);
    token.set(undefined);
    authenticated.set(false);
    await auth0Client?.logout({
        logoutParams: {
            returnTo: currentUrl.origin,
        },
    });
};
