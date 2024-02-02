import type { DailyResourceDownloads } from '$lib/types/reporting';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import { Role } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, params, parent }) => {
    const data = await parent();

    if (!data.currentUser) {
        return {};
    }

    if (data.currentUser.is(Role.Publisher) || data.currentUser.is(Role.Admin)) {
        const report = fetchJsonStreamingFromApi(
            `/reports/bar-charts/${params.barChartType}`,
            {},
            fetch
        ) as StreamedData<DailyResourceDownloads[]>;
        return {
            report,
        };
    } else {
        redirect(301, '/');
    }
};
