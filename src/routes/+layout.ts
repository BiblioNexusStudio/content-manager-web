import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { fetchJsonFromApi } from '$lib/utils/http-service';
import type { Language, ResourceContentStatus, ResourceType } from '$lib/types/base';

export const load: LayoutLoad = async ({ fetch }) => {
    const [languages, resourceTypes, resourceContentStatuses] = await Promise.all([
        getLanguages(fetch),
        getResourceTypes(fetch),
        getResourceContentStatuses(fetch),
        initI18n(),
    ]);

    await waitLocale();

    return {
        languages,
        resourceTypes,
        resourceContentStatuses,
    };
};

async function getLanguages(fetch: typeof window.fetch) {
    return (await fetchJsonFromApi('/languages', {}, fetch)) as Language[];
}

async function getResourceTypes(fetch: typeof window.fetch) {
    return (await fetchJsonFromApi('/resources/parent-resources', {}, fetch)) as ResourceType[];
}

async function getResourceContentStatuses(fetch: typeof window.fetch) {
    return (await fetchJsonFromApi('/resources/content/statuses', {}, fetch)) as ResourceContentStatus[];
}
