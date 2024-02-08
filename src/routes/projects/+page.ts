import type { PageLoad } from '../$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ProjectListResponse } from '$lib/types/projects';
import { Role } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
    const data = await parent();

    if (!data.currentUser) {
        return {};
    }

    if (data.currentUser.is(Role.Publisher) || data.currentUser.is(Role.Admin)) {
        const projectListResponse = fetchJsonStreamingFromApi('/projects', {}, fetch) as StreamedData<
            ProjectListResponse[]
        >;
        return { projectListResponse };
    } else {
        throw redirect(301, '/');
    }
};
