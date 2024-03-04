﻿import { type Writable, writable, derived } from 'svelte/store';
import { Auth0Client, createAuth0Client, User as Auth0User } from '@auth0/auth0-spa-js';
import config from '$lib/config';
import { log } from '$lib/logger';
import type { CurrentUser } from '$lib/types/base';

export let auth0Client: Auth0Client | undefined = undefined;
export const profile: Writable<Auth0User | undefined> = writable(undefined);
export const isAuthenticatedStore: Writable<boolean | undefined> = writable(undefined);

export const currentUser: Writable<CurrentUser | null> = writable(null);

export function setCurrentUser(user: CurrentUser | null) {
    currentUser.set(user);
}

export const userCan = derived(currentUser, (user) => {
    return (permission: Permission) => {
        if (user === null) {
            throw new Error('You must `await parent()` in a +page.ts before you can use `userCan`.');
        }
        return user.permissions.includes(permission);
    };
});

export const userIsInCompany = derived(currentUser, (user) => {
    return (companyId: number | undefined) => {
        if (user === null) {
            throw new Error('You must `await parent()` in a +page.ts before you can use `userIsInCompany`.');
        }
        return companyId !== undefined && user?.company.id === companyId;
    };
});

export const userIsEqual = derived(currentUser, (user) => {
    return (userId: number | undefined) => {
        if (user === null) {
            throw new Error('You must `await parent()` in a +page.ts before you can use `userIsEqual`.');
        }
        return userId !== undefined && user?.id === userId;
    };
});

const auth0Domain = config.PUBLIC_AUTH0_DOMAIN;
const auth0ClientId = config.PUBLIC_AUTH0_CLIENT_ID;
const auth0Audience = config.PUBLIC_AUTH0_AUDIENCE;

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
    AiSimplify = 'ai:simplify',
    AiTranslate = 'ai:translate',
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

    try {
        let isAuthenticated = await client.isAuthenticated();
        isAuthenticatedStore.set(isAuthenticated);

        if (!isAuthenticated && url.searchParams.has('code') && url.searchParams.has('state')) {
            await client.handleRedirectCallback();
            window.location.href = '/';
            isAuthenticated = await client.isAuthenticated();
            isAuthenticatedStore.set(isAuthenticated);
        }

        if (isAuthenticated) {
            profile.set(await client.getUser());
            await auth0Client.getTokenSilently();
            isAuthenticatedStore.set(true);
        } else {
            await login(url);
        }

        return isAuthenticated;
    } catch (error) {
        log.exception(error as Error);
        isAuthenticatedStore.set(false);
        await logout(url);
        return false;
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
    await auth0Client?.logout({
        logoutParams: {
            returnTo: url.origin,
        },
    });
}
