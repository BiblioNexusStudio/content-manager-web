import type { PageLoad } from './$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { ProjectResponse } from '$lib/types/projects';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params, parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.ReadProjects)) {
        const projectResponse = getFromApiWithoutBlocking<ProjectResponse>(`/projects/${params.projectId}`, fetch);
        return { projectResponse };
    } else {
        throw redirect(302, '/');
    }
};
