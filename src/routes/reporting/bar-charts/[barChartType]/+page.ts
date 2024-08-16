import type { DailyResourceDownloads } from '$lib/types/reporting';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sideBarHiddenOnPage } from '$lib/stores/app';
import { buildQueryString, searchParametersForLoad, ssp } from '$lib/utils/sveltekit-search-params';

export const _searchParamsConfig = {
    startDate: ssp.string(new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!),
    endDate: ssp.string(new Date().toISOString().split('T')[0]!),
};

export const load: PageLoad = async ({ params, url, parent, fetch }) => {
    await parent();

    sideBarHiddenOnPage.set(true);

    if (get(userCan)(Permission.ReadReports)) {
        const searchParams = searchParametersForLoad(url, _searchParamsConfig);
        const queryString = buildQueryString([
            { key: 'startDate', value: searchParams.startDate, ignoreIfEquals: '' },
            { key: 'endDate', value: searchParams.endDate, ignoreIfEquals: '' },
        ]);

        const report = getFromApiWithoutBlocking<DailyResourceDownloads[]>(
            `/reports/bar-charts/${params.barChartType}?${queryString}`,
            fetch
        );
        return {
            report,
        };
    } else {
        redirect(302, '/');
    }
};
