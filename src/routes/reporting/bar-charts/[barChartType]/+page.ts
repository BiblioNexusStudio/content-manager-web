import type { DailyResourceDownloads } from '$lib/types/reporting';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ fetch, params, parent }) => {
    const data = await parent();

    if (!data.loaded) {
        return {};
    }

    if (get(userCan)(Permission.ReadReports)) {
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
