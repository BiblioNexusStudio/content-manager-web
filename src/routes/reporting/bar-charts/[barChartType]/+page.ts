import type { DailyResourceDownloads } from '$lib/types/reporting';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sideBarHiddenOnPage } from '$lib/stores/app';

export const load: PageLoad = async ({ fetch, params, parent }) => {
    await parent();

    sideBarHiddenOnPage.set(true);

    if (get(userCan)(Permission.ReadReports)) {
        const report = getFromApiWithoutBlocking<DailyResourceDownloads[]>(
            `/reports/bar-charts/${params.barChartType}`,
            {},
            fetch
        );
        return {
            report,
        };
    } else {
        redirect(302, '/');
    }
};
