import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import type { DynamicReport } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sideBarHiddenOnPage } from '$lib/stores/app';
import { buildQueryString, searchParametersForLoad, ssp } from '$lib/utils/sveltekit-search-params';

export const _searchParamsConfig = {
    startDate: ssp.string(''),
    endDate: ssp.string(''),
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
        const reportData = getFromApiWithoutBlocking<DynamicReport>(
            `/reports/dynamic/${params.slug}?${queryString}`,
            fetch
        );
        return {
            reportData,
        };
    } else {
        throw redirect(302, '/');
    }
};
