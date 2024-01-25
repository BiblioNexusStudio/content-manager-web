import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { MonthlyStartsAndCompletions } from '$lib/types/reporting';

export const load: PageLoad = async ({ params, fetch }) => {
    const report = fetchJsonStreamingFromApi(
        `/reports/${params.monthlyReportType}/monthly`,
        {},
        fetch
    ) as StreamedData<MonthlyStartsAndCompletions>;
    return {
        reportType: params.monthlyReportType,
        report,
    };
};
