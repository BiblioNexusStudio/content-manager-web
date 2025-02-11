import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import type { ResourceContentStatusEnum } from '$lib/types/base';
import { ssp, searchParametersForLoad, buildQueryString } from '$lib/utils/sveltekit-search-params';
import { get } from 'svelte/store';
import { resourcesPerPage } from '$lib/stores/resources';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const _searchParamsConfig = {
    page: ssp.number(1),
    languageId: ssp.number(0),
    resourceId: ssp.number(0),
    bookCode: ssp.string(''),
    startChapter: ssp.number(0),
    endChapter: ssp.number(0),
    isPublished: ssp.string(''),
    query: ssp.string(''),
};

export const load: PageLoad = async ({ parent, url, fetch }) => {
    const searchParams = searchParametersForLoad(url, _searchParamsConfig);

    await parent();

    if (!get(userCan)(Permission.ReadResourceLists)) {
        redirect(302, '/');
    }

    return {
        // by returning a nested object here, SvelteKit won't await the promise before rendering the
        // +page.svelte and instead we can await the promise on the page to show a loader inside the table
        // TODO: when upgrading to SvelteKit 2 the nested part isn't necessary, just return the unresolved promise
        resourceContentData: {
            promise: getResourceContents(
                fetch,
                searchParams.page,
                get(resourcesPerPage),
                searchParams.languageId,
                searchParams.resourceId,
                searchParams.bookCode,
                searchParams.startChapter,
                searchParams.endChapter,
                searchParams.isPublished,
                searchParams.query
            ),
        },
    };
};

function getResourceContents(
    injectedFetch: typeof window.fetch,
    currentPage: number,
    limit: number,
    languageId: number,
    parentResourceId: number,
    bookCode: string,
    startChapter: number,
    endChapter: number,
    isPublished: string,
    query: string
) {
    const offset = (currentPage - 1) * limit;
    const queryString = buildQueryString([
        { key: 'offset', value: offset, ignoreIfEquals: 0 },
        { key: 'limit', value: limit },
        { key: 'languageId', value: languageId, ignoreIfEquals: 0 },
        { key: 'parentResourceId', value: parentResourceId, ignoreIfEquals: 0 },
        { key: 'bookCode', value: bookCode, ignoreIfEquals: '' },
        { key: 'startChapter', value: startChapter, ignoreIfEquals: 0 },
        { key: 'endChapter', value: endChapter, ignoreIfEquals: 0 },
        { key: 'isPublished', value: isPublished, ignoreIfEquals: '' },
        { key: 'searchQuery', value: query, ignoreIfEquals: '' },
    ]);

    // If no params are being passed, then return null and don't make the request
    if (queryString.match(/^limit=\d+$/)) {
        return null;
    }

    return getFromApi<ResourceContentResponse>(`/resources/content?${queryString}`, injectedFetch);
}

export interface ResourceContentResponse {
    resourceContents: ResourceContentItem[];
    total: number;
}

export interface ResourceContentItem {
    id: number;
    englishLabel: string;
    languageEnglishDisplay: string;
    parentResourceName: string;
    status: ResourceContentStatusEnum;
    isPublished: boolean;
    hasAudio: boolean;
}
