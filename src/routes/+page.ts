import type { PageLoad } from './$types';
import config from '$lib/config';

export const load: PageLoad = async ({ fetch }) => {
    const res = await fetch(`${config.PUBLIC_AQUIFER_API_URL}/resources/summary`);
    const summary: ResourcesSummary = await res.json();

    return { summary };
};

export interface ResourcesByParentResource extends TotalsByMonth {
    parentResourceName: string;
}

export interface ResourcesByLanguage extends ResourcesByParentResource {
    language: string;
}

export interface TotalsByMonth {
    date: Date;
    monthAbbreviation: string;
    resourceCount: number;
}

export interface ResourcesSummary {
    resourcesByParentResource: ResourcesByParentResource[];
    resourcesByLanguage: ResourcesByLanguage[];
    totalsByMonth: TotalsByMonth[];
    allResourcesCount: number;
    multiLanguageResourcesCount: number;
    languages: string[];
    parentResourceNames: string[];
}
