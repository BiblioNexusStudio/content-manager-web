import type { PageLoad } from '../$types';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent }) => {
    const data = await parent();

    if (!data.loaded) {
        return {};
    }

    if (get(userCan)(Permission.AiSimplify)) {
        return {};
    } else {
        throw redirect(302, '/');
    }
};
