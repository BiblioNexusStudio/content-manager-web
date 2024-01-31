import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { EditedResourcesLastThirtyDaysResponse, MostRequestedResourcesResponse } from '$lib/types/reporting';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
    const listId = params.listId;
    const listData = fetchJsonStreamingFromApi(`/reports/resources/${listId}`, {}, fetch) as StreamedData<
        EditedResourcesLastThirtyDaysResponse[] | MostRequestedResourcesResponse[]
    >;
    return {
        listData,
        listId,
    };
};
