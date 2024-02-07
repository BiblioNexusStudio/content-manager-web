import type { PageLoad } from './$types';
import { fetchJsonFromApiWithAuth } from '$lib/utils/http-service';
import type { Bible, Company, ProjectPlatform } from '$lib/types/base';
import { redirect } from '@sveltejs/kit';
import { Permission } from '$lib/stores/auth';

export const load: PageLoad = async ({ fetch, parent }) => {
    const { languages, currentUser } = await parent();

    if (currentUser.can(Permission.CreateProject)) {
        const englishLanguageId = languages?.find((l) => l.iso6393Code === 'eng')?.id;
        return {
            projectPlatforms: await fetchJsonFromApiWithAuth<ProjectPlatform[]>('/project-platforms', {}, fetch),
            companies: await fetchJsonFromApiWithAuth<Company[]>('/companies', {}, fetch),
            bibles: await fetchJsonFromApiWithAuth<Bible[]>(`/bibles/language/${englishLanguageId}`, {}, fetch),
        };
    } else {
        throw redirect(301, '/');
    }
};
