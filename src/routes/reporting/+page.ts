import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ResourcesSummary, ResourceItemsSummary } from '$lib/types/reporting';
import { Role } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
    const data = await parent();

    if (!data.currentUser) {
        return {};
    }

    if (data.currentUser.is(Role.Publisher) || data.currentUser.is(Role.Admin)) {
        const summary = fetchJsonStreamingFromApi(
            '/admin/resources/summary',
            {},
            fetch
        ) as StreamedData<ResourcesSummary>;
        const resourceItemsSummary = fetchJsonStreamingFromApi(
            '/reports/resources/item-totals',
            {},
            fetch
        ) as StreamedData<ResourceItemsSummary>;
        return { summary, resourceItemsSummary };
    } else {
        throw redirect(301, '/');
    }
};
