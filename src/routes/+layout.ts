import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { fetchJsonFromApiWithAuth } from '$lib/utils/http-service';
import type { Language, ResourceContentStatus, ResourceType, User } from '$lib/types/base';
import { browser } from '$app/environment';
import { initAuth0 } from '$lib/stores/auth';

export const load: LayoutLoad = async ({ fetch, url }) => {
    let languages: Language[] | null = null;
    let resourceTypes: ResourceType[] | null = null;
    let resourceContentStatuses: ResourceContentStatus[] | null = null;
    let users: User[] | null = null;
    let currentUser: User | null = null;

    if (browser) {
        await initAuth0(url);
    }

    [languages, resourceTypes, resourceContentStatuses, users, currentUser] = (
        await Promise.allSettled([
            getLanguages(fetch),
            getResourceTypes(fetch),
            getResourceContentStatuses(fetch),
            getUsers(fetch),
            getCurrentUser(fetch),
        ])
    ).map((result) => (result.status === 'fulfilled' ? result.value : null)) as [
        Language[] | null,
        ResourceType[] | null,
        ResourceContentStatus[] | null,
        User[] | null,
        User | null,
    ];

    await initI18n();
    await waitLocale();

    // IMPORTANT: This type-casting is not technically correct, since the fetched data could be `null`
    //            due to an auth error. However, we have code that conditionally renders the UI based on
    //            the `loaded` boolean so we can be sure that when rendering any pages these are non-null.
    return {
        loaded:
            languages !== null && resourceTypes !== null && resourceContentStatuses !== null && currentUser !== null,
        languages: languages as Language[],
        resourceTypes: resourceTypes as ResourceType[],
        resourceContentStatuses: resourceContentStatuses as ResourceContentStatus[],
        users: users as User[],
        currentUser: currentUser as User,
    };
};

async function getLanguages(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/languages', {}, fetch)) as Language[];
}

async function getUsers(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/admin/users', {}, fetch)) as User[];
}

async function getCurrentUser(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/admin/users/self', {}, fetch)) as User;
}

async function getResourceTypes(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/resources/parent-resources', {}, fetch)) as ResourceType[];
}

async function getResourceContentStatuses(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/admin/resources/content/statuses', {}, fetch)) as ResourceContentStatus[];
}
