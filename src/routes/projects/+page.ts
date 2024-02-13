import type { PageLoad } from '../$types';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import type { ProjectListResponse } from '$lib/types/projects';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ fetch, parent }) => {
    const data = await parent();

    if (!data.loaded) {
        return {};
    }

    if (get(userCan)(Permission.ReadProjects)) {
        const projectListResponse = fetchJsonStreamingFromApi('/projects', {}, fetch) as StreamedData<
            ProjectListResponse[]
        >;
        return { projectListResponse };
    } else {
        throw redirect(301, '/');
    }
};
