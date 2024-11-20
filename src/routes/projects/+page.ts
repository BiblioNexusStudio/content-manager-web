import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import type { ProjectListResponse } from '$lib/types/projects';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { Company } from '$lib/types/base';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.ReadProjects)) {
        const [projects, companies] = await Promise.all([
            getFromApi<ProjectListResponse[]>('/projects', fetch),
            getFromApi<Company[]>(`/companies`, fetch),
        ]);
        return { projects, companies };
    } else if (get(userCan)(Permission.ReadProjectsInCompany)) {
        const projects = await getFromApi<ProjectListResponse[]>('/projects', fetch);
        return { projects, companies: [] as Company[] };
    } else {
        throw redirect(302, '/');
    }
};
