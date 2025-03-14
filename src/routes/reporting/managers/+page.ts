import { getFromApi } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import type { BasicDynamicReport } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import errorGotoPath from '$lib/stores/error-goto-path';
import type { Company } from '$lib/types/base';
import { _searchParamsConfig } from '../../../lib/components/reporting/Constants';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    errorGotoPath.set('/reporting');

    if (get(userCan)(Permission.ReadReports)) {
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
