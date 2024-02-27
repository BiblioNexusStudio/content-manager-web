import type { PageLoad } from './$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { MonthlyStartsAndCompletions } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sideBarHiddenOnPage } from '$lib/stores/app';

export const load: PageLoad = async ({ params, fetch, parent }) => {
    await parent();

    sideBarHiddenOnPage.set(true);

    if (get(userCan)(Permission.ReadReports)) {
        const report = getFromApiWithoutBlocking<MonthlyStartsAndCompletions>(
            `/reports/${params.monthlyReportType}/monthly`,
            {},
            fetch
        );
        return {
            reportType: params.monthlyReportType,
            report,
        };
    } else {
        throw redirect(302, '/');
    }
};
