import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ResourcesSummary, ResourceItemsSummary } from '$lib/types/reporting';

export const load: PageLoad = async ({ fetch }) => {
    const summary = fetchJsonStreamingFromApi('/admin/resources/summary', {}, fetch) as StreamedData<ResourcesSummary>;
    const resourceItemsSummary = fetchJsonStreamingFromApi(
        '/reports/resources/item-totals',
        {},
        fetch
    ) as StreamedData<ResourceItemsSummary>;
    return { summary, resourceItemsSummary };
};
