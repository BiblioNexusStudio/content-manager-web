import { getFromApi } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import type { BasicDynamicReport } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import errorGotoPath from '$lib/stores/error-goto-path';
import type { Company } from '$lib/types/base';
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
        const managerDynamicReportsPromise = getFromApi<BasicDynamicReport[]>(`/reports/dynamic`, fetch);
        const companiesPromise = get(userCan)(Permission.ReadUsers)
            ? getFromApi<Company[]>(`/companies`, fetch)
            : Promise.resolve([] as Company[]);

        const [managerDynamicReports, companies] = await Promise.all([managerDynamicReportsPromise, companiesPromise]);

        return {
            managerDynamicReports,
            companies,
        };
    } else {
        redirect(302, '/');
    }
};
