import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { MonthlyStartsAndCompletions } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sideBarHiddenOnPage } from '$lib/stores/app';

export const load: PageLoad = async ({ params, fetch, parent }) => {
    const data = await parent();

    sideBarHiddenOnPage.set(true);

    if (!data.loaded) {
        return {};
    }

    if (get(userCan)(Permission.ReadReports)) {
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
