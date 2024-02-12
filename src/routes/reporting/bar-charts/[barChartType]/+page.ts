import type { DailyResourceDownloads } from '$lib/types/reporting';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import { Permission } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, params, parent }) => {
    const data = await parent();

    if (!data.currentUser) {
        return {};
    }

    if (data.currentUser.can(Permission.ReadReports)) {
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
