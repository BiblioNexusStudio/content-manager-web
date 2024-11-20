import type { PageLoad } from './$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { ProjectListResponse } from '$lib/types/projects';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { Company } from '$lib/types/base';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.ReadProjects)) {
        const projectListResponse = getFromApiWithoutBlocking<ProjectListResponse[]>('/projects', fetch);
        const companies = getFromApiWithoutBlocking<Company[]>(`/companies`, fetch);
        return { projectListResponse, companies };
    } else if (get(userCan)(Permission.ReadProjectsInCompany)) {
        const projectListResponse = getFromApiWithoutBlocking<ProjectListResponse[]>('/projects', fetch);
        return { projectListResponse, companies: { promise: Promise.resolve([]) } };
    } else {
        throw redirect(302, '/');
    }
};
