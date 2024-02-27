import type { PageLoad } from './$types';
import { fetchJsonFromApiWithAuth } from '$lib/utils/http-service';
import type { Bible, Company, ProjectPlatform } from '$lib/types/base';
import { redirect } from '@sveltejs/kit';
import { Permission, userCan } from '$lib/stores/auth';
import { sortByKey } from '$lib/utils/sorting';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ fetch, parent }) => {
    const { languages } = await parent();

    if (get(userCan)(Permission.CreateProject)) {
        const englishLanguageId = languages?.find((l) => l.iso6393Code === 'eng')?.id;
        return {
            projectPlatforms: sortByKey(
                await fetchJsonFromApiWithAuth<ProjectPlatform[]>('/project-platforms', {}, fetch),
                'name'
            ),
            companies: sortByKey(await fetchJsonFromApiWithAuth<Company[]>('/companies', {}, fetch), 'name'),
            bibles: await fetchJsonFromApiWithAuth<Bible[]>(`/bibles/language/${englishLanguageId}`, {}, fetch),
        };
    } else {
        throw redirect(302, '/');
    }
};
