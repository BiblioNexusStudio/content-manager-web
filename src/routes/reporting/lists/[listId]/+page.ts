import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import type { GenericReportRow } from '$lib/types/reporting';

export const load: PageLoad = async ({ params, fetch }) => {
    const listId = params.listId;
    const listData = fetchJsonStreamingFromApi(`/reports/resources/${listId}`, {}, fetch) as StreamedData<
        GenericReportRow[]
    >;
    return {
        listData,
        listId,
    };
};
