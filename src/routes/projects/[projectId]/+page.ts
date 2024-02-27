import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ProjectResponse } from '$lib/types/projects';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ fetch, params, parent }) => {
    await parent();

    if (get(userCan)(Permission.ReadProjects)) {
        const projectResponse = fetchJsonStreamingFromApi(
            `/projects/${params.projectId}`,
            {},
            fetch
        ) as StreamedData<ProjectResponse>;
        return { projectResponse };
    } else {
        throw redirect(302, '/');
    }
};
