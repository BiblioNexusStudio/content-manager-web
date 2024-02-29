import type { PageLoad } from './$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { ResourcesSummary, ResourceItemsSummary } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent }) => {
    await parent();

    if (get(userCan)(Permission.ReadReports)) {
        const summary = getFromApiWithoutBlocking<ResourcesSummary>('/admin/resources/summary');
        const resourceItemsSummary = getFromApiWithoutBlocking<ResourceItemsSummary>('/reports/resources/item-totals');
        return { summary, resourceItemsSummary };
    } else {
        throw redirect(302, '/');
    }
};
