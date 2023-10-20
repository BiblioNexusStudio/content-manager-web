import type { PageLoad } from './$types';
import config from '$lib/config';

export const load: PageLoad = async ({ fetch }) => {
    const res = await fetch(`${config.PUBLIC_AQUIFER_API_URL}/resources/summary`);
    const summary: ResourcesSummary = await res.json();

    return { summary };
};

export interface ResourcesByType extends TotalsByMonth {
    resourceType: string;
}

export interface ResourcesByLanguage extends ResourcesByType {
    language: string;
}

export interface TotalsByMonth {
    date: Date;
    monthAbbreviation: string;
    resourceCount: number;
}

export interface ResourcesSummary {
    resourcesByType: ResourcesByType[];
    resourcesByLanguage: ResourcesByLanguage[];
    totalsByMonth: TotalsByMonth[];
    allResourcesCount: number;
    multiLanguageResourcesCount: number;
    languages: string[];
    resourceTypes: string[];
}
