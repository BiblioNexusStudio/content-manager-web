import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { fetchJsonFromApiWithAuth } from '$lib/utils/http-service';
import type { Language, ResourceContentStatus, ResourceType, User, CurrentUserApi } from '$lib/types/base';
import { browser } from '$app/environment';
import { initAuth0, initPermissionChecking, type CurrentUser, Permission } from '$lib/stores/auth';

export const load: LayoutLoad = async ({ fetch, url, data }) => {
    let isAuthenticated: boolean;

    // If it's client side, check the client auth state, otherwise check if there's an auth cookie
    if (browser) {
        isAuthenticated = await initAuth0(url);
    } else {
        isAuthenticated = data.hasAuthCookie;
    }

    const [languages, resourceTypes, resourceContentStatuses, currentUser] = await Promise.all([
        getLanguages(fetch, isAuthenticated),
        getResourceTypes(fetch, isAuthenticated),
        getResourceContentStatuses(fetch, isAuthenticated),
        getCurrentUser(fetch, isAuthenticated),
    ]);

    let users: User[] | null = null;

    if (currentUser?.permissions.includes(Permission.ReadUsers)) {
        users = await fetchJsonFromApiWithAuth<User[]>('/admin/users', {}, fetch);
    }

    await initI18n();
    await waitLocale();

    // IMPORTANT: This type-casting is not technically correct, since the fetched data could be `null`
    //            due to an auth error. However, we have code that conditionally renders the UI based on
    //            the `loaded` boolean so we can be sure that when rendering any pages these are non-null.
    return {
        isAuthenticated,
        loaded:
            languages !== null && resourceTypes !== null && resourceContentStatuses !== null && currentUser !== null,
        languages: languages as Language[],
        resourceTypes: resourceTypes as ResourceType[],
        resourceContentStatuses: resourceContentStatuses as ResourceContentStatus[],
        currentUser: initPermissionChecking(currentUser) as CurrentUser,
        users,
    };
};

async function getLanguages(fetch: typeof window.fetch, isAuthenticated: boolean) {
    if (isAuthenticated) {
        return await fetchJsonFromApiWithAuth<Language[]>('/languages', {}, fetch);
    }
    return null;
}

async function getCurrentUser(fetch: typeof window.fetch, isAuthenticated: boolean) {
    if (isAuthenticated) {
        return await fetchJsonFromApiWithAuth<CurrentUserApi>('/admin/users/self', {}, fetch);
    }
    return null;
}

async function getResourceTypes(fetch: typeof window.fetch, isAuthenticated: boolean) {
    if (isAuthenticated) {
        return await fetchJsonFromApiWithAuth<ResourceType[]>('/resources/parent-resources', {}, fetch);
    }
    return null;
}

async function getResourceContentStatuses(fetch: typeof window.fetch, isAuthenticated: boolean) {
    if (isAuthenticated) {
        return await fetchJsonFromApiWithAuth<ResourceContentStatus[]>('/admin/resources/content/statuses', {}, fetch);
    }
    return null;
}
