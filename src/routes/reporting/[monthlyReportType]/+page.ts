import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { MonthlyStartsAndCompletions } from '$lib/types/reporting';
import { Role } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch, parent }) => {
    const data = await parent();

    if (!data.currentUser) {
        return {};
    }

    if (data.currentUser.is(Role.Publisher) || data.currentUser.is(Role.Admin)) {
        const report = fetchJsonStreamingFromApi(
            `/reports/${params.monthlyReportType}/monthly`,
            {},
            fetch
        ) as StreamedData<MonthlyStartsAndCompletions>;
        return {
            reportType: params.monthlyReportType,
            report,
        };
    } else {
        throw redirect(301, '/');
    }
};
