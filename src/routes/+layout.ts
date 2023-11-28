import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { fetchWrapper } from '$lib/utils/http-service';
import config from '$lib/config';
import type { Language, ResourceType } from '$lib/types/base';

export const load: LayoutLoad = async () => {
    const [languages, resourceTypes] = await Promise.all([getLanguages(), getResourceTypes(), initI18n()]);

    await waitLocale();

    return {
        languages,
        resourceTypes,
    };
};

async function getLanguages() {
    const languageRes = await fetchWrapper(`${config.PUBLIC_AQUIFER_API_URL}/languages`);
    return (await languageRes.json()) as Language[];
}

async function getResourceTypes() {
    const resourceTypeRes = await fetchWrapper(`${config.PUBLIC_AQUIFER_API_URL}/resources/parent-resources`);
    return (await resourceTypeRes.json()) as ResourceType[];
}
