import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ResourcesSummary, ResourceItemsSummary } from '$lib/types/reporting';
import { Permission } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
    const data = await parent();

    if (!data.loaded) {
        return {};
    }

    if (data.currentUser.can(Permission.ReadReports)) {
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
