import { type Writable, writable, derived } from 'svelte/store';
import { Auth0Client, createAuth0Client, User as Auth0User } from '@auth0/auth0-spa-js';
import config from '$lib/config';
import { log } from '$lib/logger';
import { dev } from '$app/environment';
import type { CurrentUser } from '$lib/types/base';

export let auth0Client: Auth0Client | undefined = undefined;
export const profile: Writable<Auth0User | undefined> = writable(undefined);
export const isAuthenticatedStore: Writable<boolean | undefined> = writable(undefined);

export const currentUser: Writable<CurrentUser | null> = writable(null);

export function setCurrentUser(user: CurrentUser | null) {
    currentUser.set(user);
}

export const userCan = derived(currentUser, (user) => {
    return (permission: Permission) => !!user?.permissions.includes(permission);
});

export const userIsInCompany = derived(currentUser, (user) => {
    return (companyId: number | undefined) => companyId !== undefined && user?.company.id === companyId;
});

export const userIsEqual = derived(currentUser, (user) => {
    return (userId: number | undefined) => userId !== undefined && user?.id === userId;
});

const auth0Domain = config.PUBLIC_AUTH0_DOMAIN;
const auth0ClientId = config.PUBLIC_AUTH0_CLIENT_ID;
const auth0Audience = config.PUBLIC_AUTH0_AUDIENCE;

export const AUTH_COOKIE_NAME = 'AuthToken';

export enum Permission {
    AssignContent = 'assign:content',
    AssignOutsideCompany = 'assign:outside-company',
    AssignOverride = 'assign:override',
    CreateContent = 'create:content',
    CreateProject = 'create:project',
    CreateUser = 'create:user',
    CreateUserInCompany = 'create:users-in-company',
    EditContent = 'edit:content',
    EditProjects = 'edit:projects',
    PublishContent = 'publish:content',
    ReadProjects = 'read:projects',
    ReadReports = 'read:reports',
    ReadUsers = 'read:users',
    ReadAllUsers = 'read:all-users',
    ReviewContent = 'review:content',
    SendReviewContent = 'send-review:content',
    ReadCompanyContentAssignments = 'read:company-content-assignments',
}

export interface CurrentUserHydrated extends CurrentUser, MissingUserWithFunctions {}

export interface MissingUserWithFunctions {
    can: (permission: Permission) => boolean;
    inCompany: (companyId: number | undefined) => boolean;
}

export function initPermissionChecking(user: CurrentUser | null): CurrentUserHydrated | MissingUserWithFunctions {
    if (user === null) {
        return {
            can: () => false,
            inCompany: () => false,
        } as MissingUserWithFunctions;
    } else {
        return {
            ...user,
            can: (permission: Permission) => user.permissions.includes(permission),
            inCompany: (companyId: number | undefined) => user.company?.id === companyId,
        } as CurrentUserHydrated;
    }
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

    auth0Client = client;

    let isAuthenticated = await client.isAuthenticated();
    isAuthenticatedStore.set(isAuthenticated);

    if (!isAuthenticated && url.searchParams.has('code') && url.searchParams.has('state')) {
        await client.handleRedirectCallback();
        window.location.href = '/';
        isAuthenticated = await client.isAuthenticated();
        isAuthenticatedStore.set(isAuthenticated);
    }

    if (isAuthenticated) {
        try {
            // set cookie and ensure refresh token is valid (logs out if not)
            await syncAuthTokenToCookies(client, url, true);

            profile.set(await client.getUser());
        } catch (error) {
            log.exception(error as Error);
        }
    } else {
        await login(url);
    }
    return isAuthenticated;
}

export async function syncAuthTokenToCookies(client: Auth0Client | undefined, url: URL, logoutOnError: boolean) {
    if (client) {
        try {
            if (await client.isAuthenticated()) {
                isAuthenticatedStore.set(true);
                const authToken = await client.getTokenSilently();

                // set an AuthToken cookie so that SSR requests receive a cookie that can be used against the API
                setCookie(AUTH_COOKIE_NAME, authToken, {
                    path: '/',
                    sameSite: 'strict',
                    expires: getJwtExpiration(authToken),
                    secure: !dev,
                });
            } else {
                isAuthenticatedStore.set(false);
                await logout(url);
            }
        } catch {
            if (logoutOnError) {
                await logout(url);
            }
        }
    }
}

async function login(url: URL) {
    await auth0Client?.loginWithRedirect({
        authorizationParams: {
            redirect_uri: url.origin,
        },
    });
}

export async function logout(url: URL) {
    profile.set(undefined);
    clearCookie(AUTH_COOKIE_NAME);
    await auth0Client?.logout({
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

function clearCookie(name: string) {
    setCookie(name, '', { expires: -1 });
}

function getJwtExpiration(jwt: string) {
    const payload = jwt.split('.')[1];
    if (payload) {
        const decodedPayload = JSON.parse(atob(payload));
        return parseInt(decodedPayload.exp);
    }
    return 0;
}
