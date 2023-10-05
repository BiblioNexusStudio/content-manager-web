import type { PageLoad } from './$types';
import config from '$lib/config';

export const load: PageLoad = async ({ fetch, params }) => {
    const res = await fetch(`${config.PUBLIC_AQUIFER_API_URL}/resources/summary`);
    const summary: ResourcesSummary = await res.json();

    return { summary };
};

export interface ResourcesByType {
    resourceType: string;
    date: Date;
    status: number;
    resourceCount: number;
}

export interface ResourcesByLanguage {
    languageName: string;
    resourceType: string;
    date: Date;
    resourceCount: number;
}

export interface ResourcesSummary {
    resourcesByType: ResourcesByType[];
    resourcesByLanguage: ResourcesByLanguage[];
    allResourcesCount: number;
    multiLanguageResourcesCount: number;
}
