import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import type { BibleBook, Company } from '$lib/types/base';
import { redirect } from '@sveltejs/kit';
import { Permission, userCan } from '$lib/stores/auth';
import { sortByKey } from '$lib/utils/sorting';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.CreateProject)) {
        const [companies, bibleBooks] = await Promise.all([
            getFromApi<Company[]>('/companies', fetch),
            getFromApi<BibleBook[]>('/bibles/1/books', fetch),
        ]);
        return {
            companies: sortByKey(companies, 'name'),
            bibleBooks,
        };
    } else {
        redirect(302, '/');
    }
};
