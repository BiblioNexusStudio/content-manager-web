import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import type { BibleBook, Company, ProjectPlatform } from '$lib/types/base';
import { redirect } from '@sveltejs/kit';
import { Permission, userCan } from '$lib/stores/auth';
import { sortByKey } from '$lib/utils/sorting';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.CreateProject)) {
        return {
            projectPlatforms: sortByKey(await getFromApi<ProjectPlatform[]>('/project-platforms', fetch), 'name'),
            companies: sortByKey(await getFromApi<Company[]>('/companies', fetch), 'name'),
            bibleBooks: await getFromApi<BibleBook[]>('/bibles/1/books', fetch),
        };
    } else {
        throw redirect(302, '/');
    }
};
