import { getFromApi } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import type { BasicDynamicReport } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import errorGotoPath from '$lib/stores/error-goto-path';
import { ssp } from '$lib/utils/sveltekit-search-params';

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
    report: ssp.string(''),
};

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    errorGotoPath.set('/reporting');

    if (get(userCan)(Permission.ReadReportsInCompany)) {
        const managerDynamicReports = await getFromApi<BasicDynamicReport[]>(`/reports/dynamic`, fetch);

        return {
            managerDynamicReports,
        };
    } else {
        redirect(302, '/');
    }
};
