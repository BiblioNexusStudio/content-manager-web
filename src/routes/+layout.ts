import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { fetchJsonFromApiWithAuth, initFetchPatch } from '$lib/utils/http-service';
import type { Language, ResourceContentStatus, ResourceType, User } from '$lib/types/base';
import { browser } from '$app/environment';
import { initAuth0 } from '$lib/stores/auth';

export const load: LayoutLoad = async ({ fetch, url }) => {
    let languages: Language[] | null = null;
    let resourceTypes: ResourceType[] | null = null;
    let resourceContentStatuses: ResourceContentStatus[] | null = null;
    let currentUser: User | null = null;

    if (browser) {
        await initAuth0(url);
        initFetchPatch();
    }

    [languages, resourceTypes, resourceContentStatuses, currentUser] = (
        await Promise.allSettled([
            getLanguages(fetch),
            getResourceTypes(fetch),
            getResourceContentStatuses(fetch),
            getCurrentUser(fetch),
        ])
    ).map((result) => (result.status === 'fulfilled' ? result.value : null)) as [
        Language[] | null,
        ResourceType[] | null,
        ResourceContentStatus[] | null,
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
        currentUser: currentUser as User,
    };
};

async function getLanguages(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/languages', {}, fetch)) as Language[];
}

async function getCurrentUser(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/users/self', {}, fetch)) as User;
}

async function getResourceTypes(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/resources/parent-resources', {}, fetch)) as ResourceType[];
}

async function getResourceContentStatuses(fetch: typeof window.fetch) {
    return (await fetchJsonFromApiWithAuth('/resources/content/statuses', {}, fetch)) as ResourceContentStatus[];
}
