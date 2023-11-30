import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi } from '$lib/utils/http-service';
import { createSearchParamStore } from '$lib/utils/search-params';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ url, fetch }) => {
    const currentPage = createSearchParamStore(url, 'page', 1);
    const recordsPerPage = createSearchParamStore(url, 'perPage', 10);
    const selectedLanguageId = createSearchParamStore(url, 'languageId', 0);
    const selectedResourceId = createSearchParamStore(url, 'resourceId', 0);
    const searchQuery = createSearchParamStore(url, 'query', '');

    return {
        currentPage,
        recordsPerPage,
        selectedLanguageId,
        selectedResourceId,
        searchQuery,
        streamedResourceList: getResourceList(
            fetch,
            get(currentPage),
            get(recordsPerPage),
            get(selectedLanguageId),
            get(selectedResourceId),
            get(searchQuery)
        ),
        streamedResourceListCount: getResourceListCount(
            fetch,
            get(selectedLanguageId),
            get(selectedResourceId),
            get(searchQuery)
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
        `/resources/list?skip=${skip}&take=${take}&languageId=${languageId}&parentResourceId=${parentResourceId}&query=${query}`,
        {},
        fetch
    );
}

function getResourceListCount(fetch: typeof window.fetch, languageId: number, parentResourceId: number, query: string) {
    return fetchJsonStreamingFromApi<number>(
        `/resources/list/count?languageId=${languageId}&parentResourceId=${parentResourceId}&query=${query}`,
        {},
        fetch
    );
}

export interface ResourceListItem {
    id: number;
    name: string;
    parentResourceName: string;
    status: string;
}
