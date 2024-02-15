import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ProjectResponse } from '$lib/types/projects';
import { Permission } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import type { User } from '$lib/types/base';

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
        const users = fetchJsonStreamingFromApi('/users', {}, fetch) as StreamedData<User[]>;
        return { projectResponse, users };
    } else {
        throw redirect(301, '/');
    }
};
