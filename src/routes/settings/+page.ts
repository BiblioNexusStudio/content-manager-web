import type { PageLoad } from './$types';
import type { TranslationPair } from '$lib/types/base';
import { Permission, userCan } from '$lib/stores/auth';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.GetTranslationPair)) {
        const translationPairs = getFromApiWithoutBlocking<TranslationPair[]>(`/translation-pairs`, fetch);
        return {
            translationPairs,
        };
    } else {
        throw redirect(302, '/');
    }
};
