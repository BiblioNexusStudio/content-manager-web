import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ProjectResponse } from '$lib/types/projects';
import { Permission } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, params, parent }) => {
    const data = await parent();

    if (!data.loaded) {
        return {};
    }

    if (data.currentUser.can(Permission.ReadProjects)) {
        const projectResponse = fetchJsonStreamingFromApi(
            `/projects/${params.projectId}`,
            {},
            fetch
        ) as StreamedData<ProjectResponse>;
        return { projectResponse };
    } else {
        throw redirect(301, '/');
    }
};
