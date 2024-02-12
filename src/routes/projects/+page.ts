import type { PageLoad } from '../$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ProjectListResponse } from '$lib/types/projects';
import { Permission } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
    const data = await parent();

    if (!data.loaded) {
        return {};
    }

    if (data.currentUser.can(Permission.ReadProjects)) {
        const projectListResponse = fetchJsonStreamingFromApi('/projects', {}, fetch) as StreamedData<
            ProjectListResponse[]
        >;
        return { projectListResponse };
    } else {
        throw redirect(301, '/');
    }
};
