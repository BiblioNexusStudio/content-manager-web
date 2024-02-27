import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { PageLoad } from './$types';
import type { GenericReportRow } from '$lib/types/reporting';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sideBarHiddenOnPage } from '$lib/stores/app';

export const load: PageLoad = async ({ params, fetch, parent }) => {
    await parent();

    sideBarHiddenOnPage.set(true);

    if (get(userCan)(Permission.ReadReports)) {
        const listId = params.listId;
        const listData = fetchJsonStreamingFromApi(`/reports/resources/${listId}`, {}, fetch) as StreamedData<
            GenericReportRow[]
        >;
        return {
            listData,
            listId,
        };
    } else {
        throw redirect(302, '/');
    }
};
