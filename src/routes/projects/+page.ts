import type { PageLoad } from '../$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { ProjectListResponse } from '$lib/types/projects';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent }) => {
    await parent();

    if (get(userCan)(Permission.ReadProjects)) {
        const projectListResponse = getFromApiWithoutBlocking<ProjectListResponse[]>('/projects');
        return { projectListResponse };
    } else {
        throw redirect(302, '/');
    }
};
