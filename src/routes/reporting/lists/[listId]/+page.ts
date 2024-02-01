import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import type { GenericReportRow } from '$lib/types/reporting';
import { Role } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch, parent }) => {
    const data = await parent();

    if (!data.currentUser) {
        return {};
    }

    if (data.currentUser.is(Role.Publisher) || data.currentUser.is(Role.Admin)) {
        const listId = params.listId;
        const listData = fetchJsonStreamingFromApi(`/reports/resources/${listId}`, {}, fetch) as StreamedData<
            GenericReportRow[]
        >;
        return {
            listData,
            listId,
        };
    } else {
        throw redirect(301, '/');
    }
};
