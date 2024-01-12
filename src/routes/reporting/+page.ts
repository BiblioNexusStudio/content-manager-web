import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ResourcesSummary } from '$lib/types/reporting';

export const load: PageLoad = async ({ fetch }) => {
    const summary = fetchJsonStreamingFromApi('/admin/resources/summary', {}, fetch) as StreamedData<ResourcesSummary>;
    return { summary };
};
