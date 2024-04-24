import type { PageLoad } from '../$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { ProjectListResponse } from '$lib/types/projects';
import { Permission, userCan, userCanOnly } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.ReadProjects)) {
        const projectListResponse = getFromApiWithoutBlocking<ProjectListResponse[]>('/projects', fetch);
        return { projectListResponse };
    } else if (get(userCanOnly)(Permission.ReadReports)) {
        throw redirect(302, '/reporting');
    } else {
        throw redirect(302, '/');
    }
};
