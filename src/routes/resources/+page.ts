import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi } from '$lib/utils/http-service';
import type { ResourceContentStatusEnum } from '$lib/types/base';
import { ssp, searchParametersForLoad } from '$lib/utils/sveltekit-search-params';

export const _searchParamsConfig = {
    page: ssp.number(1),
    perPage: ssp.number(10),
    languageId: ssp.number(0),
    resourceId: ssp.number(0),
    query: ssp.string(''),
};

export const load: PageLoad = async ({ url, fetch }) => {
    const searchParams = searchParametersForLoad(url, _searchParamsConfig);

    return {
        streamedResourceList: getResourceList(
            fetch,
            searchParams.page,
            searchParams.perPage,
            searchParams.languageId,
            searchParams.resourceId,
            searchParams.query
        ),
        streamedResourceListCount: getResourceListCount(
            fetch,
            searchParams.languageId,
            searchParams.resourceId,
            searchParams.query
        ),
    };
};

function getResourceList(
    fetch: typeof window.fetch,
    currentPage: number,
    take: number,
    languageId: number,
    parentResourceId: number,
    query: string
) {
    const skip = (currentPage - 1) * take;
    return fetchJsonStreamingFromApi<ResourceListItem[]>(
        `/admin/resources/list?skip=${skip}&take=${take}&languageId=${languageId}&parentResourceId=${parentResourceId}&query=${query}`,
        {},
        fetch
    );
}

function getResourceListCount(fetch: typeof window.fetch, languageId: number, parentResourceId: number, query: string) {
    return fetchJsonStreamingFromApi<number>(
        `/admin/resources/list/count?languageId=${languageId}&parentResourceId=${parentResourceId}&query=${query}`,
        {},
        fetch
    );
}

export interface ResourceListItemContentIdWithLanguageId {
    contentId: number;
    languageId: number;
}

export interface ResourceListItem {
    id: number;
    englishLabel: string;
    parentResourceName: string;
    status: ResourceContentStatusEnum;
    contentIdsWithLanguageIds: ResourceListItemContentIdWithLanguageId[];
}
