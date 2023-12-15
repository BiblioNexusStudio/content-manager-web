import { type Writable, writable, get } from 'svelte/store';
import { Auth0Client, createAuth0Client, User as Auth0User } from '@auth0/auth0-spa-js';
import config from '$lib/config';
import { log } from '$lib/logger';
import { dev } from '$app/environment';
import type { CurrentUserApi, User } from '$lib/types/base';

export const auth0Client: Writable<Auth0Client | undefined> = writable(undefined);
export const profile: Writable<Auth0User | undefined> = writable(undefined);
const auth0Domain = config.PUBLIC_AUTH0_DOMAIN;
const auth0ClientId = config.PUBLIC_AUTH0_CLIENT_ID;
const auth0Audience = config.PUBLIC_AUTH0_AUDIENCE;

export const AUTH_COOKIE_NAME = 'AuthToken';

export enum Permission {
    AquiferizeContent = 'aquiferize:content',
    PublishContent = 'publish:content',
    AssignContent = 'assign:content',
    AssignOverride = 'assign:override',
    SendReviewContent = 'send-review:content',
    SendReviewOverride = 'send-review:override',
    ReviewContent = 'review:content',
    ReadUsers = 'read:users',
    EditContent = 'edit:content',
}

export interface CurrentUser extends User {
    can: (permission: Permission) => boolean;
}

export function initPermissionChecking(user: CurrentUserApi | null): CurrentUser | null {
    if (user) {
        return {
            ...user,
            can: (permission: Permission) => user.permissions.includes(permission),
        };
    }
    return null;
}

export async function initAuth0(url: URL) {
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

    if (!isAuthenticated && url.searchParams.has('code') && url.searchParams.has('state')) {
        await client.handleRedirectCallback();
        window.location.href = '/';
        isAuthenticated = await client.isAuthenticated();
    }

    if (isAuthenticated) {
        try {
            // set cookie and ensure refresh token is valid (throws error if not)
            await syncAuthTokenToCookies(client);

            profile.set(await client.getUser());
        } catch (error) {
            log.exception(error as Error);
            await logout(url);
        }
    } else {
        await login(url);
    }
    return isAuthenticated;
}

export async function syncAuthTokenToCookies(client: Auth0Client | undefined) {
    if (client) {
        const authToken = await client.getTokenSilently();

        // set an AuthToken cookie so that SSR requests receive a cookie that can be used against the API
        setCookie(AUTH_COOKIE_NAME, authToken, {
            path: '/',
            sameSite: 'strict',
            expires: getJwtExpiration(authToken),
            secure: !dev,
        });
    }
}

async function login(url: URL) {
    await get(auth0Client)?.loginWithRedirect({
        authorizationParams: {
            redirect_uri: url.href,
        },
    });
}

export async function logout(url: URL) {
    profile.set(undefined);
    await get(auth0Client)?.logout({
        logoutParams: {
            returnTo: url.origin,
        },
    });
}

function setCookie(
    name: string,
    value: string,
    options: { expires?: number; path?: string; sameSite?: string; secure?: boolean } = {}
) {
    let cookie = `${name}=${value};`;

    if (options.expires) {
        const date = new Date();
        date.setTime(options.expires * 1000);
        cookie += ` expires=${date.toUTCString()};`;
    }

    cookie += ` path=${options.path || '/'};`;
    if (options.sameSite) cookie += ` SameSite=${options.sameSite};`;
    if (options.secure) cookie += ` Secure;`;

    document.cookie = cookie;
}

function getJwtExpiration(jwt: string) {
    const payload = jwt.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    return parseInt(decodedPayload.exp);
}
