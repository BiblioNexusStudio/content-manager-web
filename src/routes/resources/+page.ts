import type { PageLoad } from './$types';
import config from '$lib/config';

export const load: PageLoad = async ({ fetch, params }) => {
    const languageRes = await fetch(`${config.PUBLIC_AQUIFER_API_URL}/languages`);
    const languages: Language[] = await languageRes.json();

    const resourceTypeRes = await fetch(`${config.PUBLIC_AQUIFER_API_URL}/resources/types`);
    const resourceTypes: ResourceType[] = await resourceTypeRes.json();

    return { languages, resourceTypes, getResourceList };
};

const getResourceList = async (skip: number, take: number, query: string) => {
    console.log('getResourceList called');
    const response = await fetch(
        `${config.PUBLIC_AQUIFER_API_URL}/resources/list?skip=${skip}&take=${take}&query=${query}`
    );
    return (await response.json()) as ResourceListItem[];
};

export interface ResourceType {
    id: number;
    displayName: string;
    complexityLevel: string;
}

export interface Language {
    id: number;
    iso6393Code: string;
    englishDisplay: string;
}

export interface ResourceListItem {
    id: number;
    name: string;
    type: string;
    status: string;
}
