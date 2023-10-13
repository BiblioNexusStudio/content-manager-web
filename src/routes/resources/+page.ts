import type { PageLoad } from './$types';
import config from '$lib/config';

export const load: PageLoad = async ({ fetch, params }) => {
    return { getLanguages, getResourceTypes, getResourceList, getResourceListCount };
};

const getLanguages = async () => {
    const languageRes = await fetch(`${config.PUBLIC_AQUIFER_API_URL}/languages`);
    return (await languageRes.json()) as Language[];
};

const getResourceTypes = async () => {
    const resourceTypeRes = await fetch(`${config.PUBLIC_AQUIFER_API_URL}/resources/types`);
    return (await resourceTypeRes.json()) as ResourceType[];
};

const getResourceList = async (
    currentPage: number,
    take: number,
    languageId: number,
    resourceTypeId: number,
    query: string
) => {
    let skip = (currentPage - 1) * take;
    const response = await fetch(
        `${config.PUBLIC_AQUIFER_API_URL}/resources/list?skip=${skip}&take=${take}&languageId=${languageId}&resourceTypeId=${resourceTypeId}&query=${query}`
    );
    return (await response.json()) as ResourceListItem[];
};

const getResourceListCount = async (languageId: number, resourceTypeId: number, query: string) => {
    const response = await fetch(
        `${config.PUBLIC_AQUIFER_API_URL}/resources/list/count?languageId=${languageId}&resourceTypeId=${resourceTypeId}&query=${query}`
    );
    return +(await response.text());
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
