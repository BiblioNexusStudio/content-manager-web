import type { DailyResourceDownloads } from '$lib/types/reporting';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { PageLoad } from '../$types';

export const load: PageLoad = async ({ fetch }) => {
    const report = fetchJsonStreamingFromApi(`/reports/bar-charts/daily-resource-downloads`, {}, fetch) as StreamedData<
        DailyResourceDownloads[]
    >;
    return {
        report,
    };
};
