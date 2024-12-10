import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import type { ResourcesSummary, ResourceItemsSummary, BasicDynamicReport } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.ReadReports)) {
        const [summary, resourceItemsSummary, reports] = await Promise.all([
            getFromApi<ResourcesSummary>('/resources/content/general-reporting-summary', fetch),
            getFromApi<ResourceItemsSummary>('/reports/resources/item-totals', fetch),
            getFromApi<BasicDynamicReport[]>('/reports/dynamic', fetch),
        ]);
        return { summary, reports, resourceItemsSummary };
    } else {
        redirect(302, '/');
    }
};
