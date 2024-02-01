import type { DailyResourceDownloads } from '$lib/types/reporting';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
    console.log(params.barChartType);
    const report = fetchJsonStreamingFromApi(`/reports/bar-charts/${params.barChartType}`, {}, fetch) as StreamedData<
        DailyResourceDownloads[]
    >;
    return {
        report,
    };
};
