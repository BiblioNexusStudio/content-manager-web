import type { PageLoad } from './$types';
import config from '$lib/config';
import { fetchWrapperWithFetch } from '$lib/utils/http-service';
import { initSearchParam } from '$lib/utils/search-params';

export const load: PageLoad = async ({ url, fetch }) => {
    const currentPage = initSearchParam(url, 'page', 1);
    const recordsPerPage = initSearchParam(url, 'perPage', 10);
    const selectedLanguageId = initSearchParam(url, 'languageId', 0);
    const selectedResourceId = initSearchParam(url, 'resourceId', 0);
    const searchQuery = initSearchParam(url, 'query', '');

    return {
        currentPage,
        recordsPerPage,
        selectedLanguageId,
        selectedResourceId,
        searchQuery,
        streamed: {
            resourceList: getResourceList(
                fetch,
                currentPage.value,
                recordsPerPage.value,
                selectedLanguageId.value,
                selectedResourceId.value,
                searchQuery.value
            ),
            resourceListCount: getResourceListCount(
                fetch,
                selectedLanguageId.value,
                selectedResourceId.value,
                searchQuery.value
            ),
        },
    };
};

async function getResourceList(
    fetch: typeof window.fetch,
    currentPage: number,
    take: number,
    languageId: number,
    parentResourceId: number,
    query: string
) {
    const skip = (currentPage - 1) * take;
    const response = await fetchWrapperWithFetch(
        fetch,
        `${config.PUBLIC_AQUIFER_API_URL}/resources/list?skip=${skip}&take=${take}&languageId=${languageId}&parentResourceId=${parentResourceId}&query=${query}`
    );
    return (await response.json()) as ResourceListItem[];
}

async function getResourceListCount(
    fetch: typeof window.fetch,
    languageId: number,
    parentResourceId: number,
    query: string
) {
    const response = await fetchWrapperWithFetch(
        fetch,
        `${config.PUBLIC_AQUIFER_API_URL}/resources/list/count?languageId=${languageId}&parentResourceId=${parentResourceId}&query=${query}`
    );
    return +(await response.text());
}

export interface ResourceListItem {
    id: number;
    name: string;
    parentResourceName: string;
    status: string;
}
