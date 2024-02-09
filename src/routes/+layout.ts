import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { fetchJsonFromApiWithAuth } from '$lib/utils/http-service';
import type { Language, ResourceContentStatus, ResourceType, User, CurrentUser } from '$lib/types/base';
import { browser } from '$app/environment';
import { initAuth0, initPermissionChecking, Permission } from '$lib/stores/auth';
import { sortByKey } from '$lib/utils/sorting';

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

    const currentUserHydrated = initPermissionChecking(currentUser);

    if (currentUserHydrated.can(Permission.ReadUsers)) {
        users = await fetchJsonFromApiWithAuth<User[]>('/users', {}, fetch);
    }

    await initI18n();
    await waitLocale();

    return {
        isAuthenticated,
        loaded:
            languages !== null && resourceTypes !== null && resourceContentStatuses !== null && currentUser !== null,
        languages: sortByKey(languages, 'englishDisplay'),
        resourceTypes: resourceTypes,
        resourceContentStatuses: resourceContentStatuses,
        currentUser: currentUserHydrated,
        users: sortByKey(users, 'name'),
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
        return await fetchJsonFromApiWithAuth<CurrentUser>('/users/self', {}, fetch);
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
