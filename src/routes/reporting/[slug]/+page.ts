import { getFromApi } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import type { DynamicReport } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sideBarHiddenOnPage } from '$lib/stores/app';
import { buildQueryString, searchParametersForLoad, ssp } from '$lib/utils/sveltekit-search-params';
import type { Company } from '$lib/types/base';
import errorGotoPath from '$lib/stores/error-goto-path';

export const _defaultTableRowsPerPage = 100;

export const _searchParamsConfig = {
    paginationStart: ssp.number(0),
    paginationEnd: ssp.number(_defaultTableRowsPerPage),
    languageId: ssp.number(0),
    parentResourceId: ssp.number(0),
    companyId: ssp.number(0),
    startDate: ssp.string(''),
    endDate: ssp.string(''),
    sort: ssp.string(''),
};

export const load: PageLoad = async ({ params, url, parent, fetch }) => {
    await parent();

    sideBarHiddenOnPage.set(true);
    errorGotoPath.set('/reporting');

    const companiesPromise = get(userCan)(Permission.ReadUsers)
        ? getFromApi<Company[]>(`/companies`, fetch)
        : Promise.resolve([] as Company[]);

    if (get(userCan)(Permission.ReadReports)) {
        const searchParams = searchParametersForLoad(url, _searchParamsConfig);
        const queryString = buildQueryString([
            { key: 'startDate', value: searchParams.startDate, ignoreIfEquals: '' },
            { key: 'endDate', value: searchParams.endDate, ignoreIfEquals: '' },
            { key: 'languageId', value: searchParams.languageId, ignoreIfEquals: 0 },
            { key: 'parentResourceId', value: searchParams.parentResourceId, ignoreIfEquals: 0 },
            { key: 'companyId', value: searchParams.companyId, ignoreIfEquals: 0 },
        ]);
        const reportDataPromise = getFromApi<DynamicReport>(`/reports/dynamic/${params.slug}?${queryString}`, fetch);
        const [reportData, companies] = await Promise.all([reportDataPromise, companiesPromise]);
        return {
            reportData,
            companies,
        };
    } else {
        throw redirect(302, '/');
    }
};
