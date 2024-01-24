import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { MonthlyStartsAndCompletions } from '$lib/types/reporting';

export const load: PageLoad = async ({ fetch }) => {
    const report = fetchJsonStreamingFromApi(
        '/reports/monthly/aquiferization',
        {},
        fetch
    ) as StreamedData<MonthlyStartsAndCompletions>;
    return { report };
};
