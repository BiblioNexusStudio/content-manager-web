import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import type { ProjectResponse } from '$lib/types/projects';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import errorGotoPath from '$lib/stores/error-goto-path';

export const load: PageLoad = async ({ params, parent, fetch }) => {
    await parent();

    errorGotoPath.set('/projects');

    if (get(userCan)(Permission.ReadProjects) || get(userCan)(Permission.ReadProjectsInCompany)) {
        const canOnlyViewProjectsInCompany =
            get(userCan)(Permission.ReadProjectsInCompany) && !get(userCan)(Permission.ReadProjects);
        const projectResponse = await getFromApi<ProjectResponse>(`/projects/${params.projectId}`, fetch);
        return { projectResponse, canOnlyViewProjectsInCompany };
    } else {
        throw redirect(302, '/');
    }
};
